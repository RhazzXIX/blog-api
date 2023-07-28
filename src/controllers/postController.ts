import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import verifyUnpublishedAccess from "../assists/middlewares/verifyUnpublishedAccess";
import verifyIfAuthor from "../assists/middlewares/verifyIfAuthor";
import validate from "../assists/middlewares/validate";
import checkValidation from "../assists/middlewares/checkValidation";
import verifyIdInvalid from "../assists/functions/verifyIdInvalid";
import createHttpError from "http-errors";
import uploadImg from "../assists/middlewares/uploadImg";
import deleteImagesFromLocal from "../assists/functions/deleteImagesFromLocal";
import createPostContent from "../assists/functions/createPostContent";

// Image header updload setup.
const headerImgUpload = uploadImg.fields([
  {
    name: "headerImg1",
    maxCount: 1,
  },
  {
    name: "headerImg2",
    maxCount: 1,
  },
  {
    name: "headerImg3",
    maxCount: 1,
  },
  {
    name: "headerImg4",
    maxCount: 1,
  },
]);

const postController = {
  // Middleware for getting all blog posts.
  blogPosts: asyncHandler(async function (req, res, next) {
    // Fetch posts
    let posts: IPost[];

    // Fetch all post if the user is an Author.
    if (req.user && req.user.isAuthor) {
      posts = await Post.find()
        .populate({ path: "author", select: "name" })
        .lean()
        .exec();

      // Fetch only published posts.
    } else {
      posts = await Post.find({ isPublished: true })
        .populate({ path: "author", select: "name" })
        .sort({ publishedDate: -1 })
        .lean()
        .exec();
    }

    // Send posts data.
    if (posts.length > 0) {
      res.status(200).json(posts);

      // Send info that there are no post yet.
    } else {
      res.status(404).json({ message: "There are no posts yet." });
    }
  }),

  // Middleware for getting a single post.
  blogPost: [
    verifyUnpublishedAccess,
    asyncHandler(async function (req, res, next) {
      const post = res.locals.post;
      // Send post.
      res.status(200).json(post);
    }),
  ],

  // Middleware for creating a blog post.
  createBlogPost: [
    verifyIfAuthor,
    // Handle imgHead uploads,
    headerImgUpload,
    // Validate and sanitize.
    ...validate.post,
    checkValidation,
    // Handle Create blog post req.
    asyncHandler(async function (req, res, next) {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      // create Content.
      const content = createPostContent(files, req);

      // Create Blog post.
      const blogPost = new Post({
        content,
        author: req.user?._id,
        isPublished: false,
        totalComments: 0,
      });
      // Save the post.
      blogPost
        .save()
        // If saving the document is successful.
        .then(async () => {
          // Populate Author.
          await blogPost.populate({
            path: "author",
            select: "name",
          });
          deleteImagesFromLocal(files);

          // Send response if success.
          res.status(201).json(blogPost);
        })
        // If there are errors.
        .catch(async (err) => {
          deleteImagesFromLocal(files);
          // Delete the said post for preventing bloating the database.
          await Post.findByIdAndDelete(blogPost._id);
          next(err);
        });
    }),
  ],
  // Update a blog post.
  updateBlogPost: [
    verifyIfAuthor,
    headerImgUpload,
    ...validate.post,
    checkValidation,
    // Handle Update blog post request.
    asyncHandler(async function (req, res, next) {
      const { postId } = req.params;

      // Check if valid id.
      if (verifyIdInvalid(postId)) {
        res.status(404).send("Post not found.");
        return;
      }

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Create post content.
      const updatedContent = createPostContent(files, req);

      // Create a document for updating post.
      const blogPost = new Post({
        _id: postId,
        content: updatedContent,
      });

      // Query database and update.
      const updatedBlogPost = await Post.findByIdAndUpdate(postId, blogPost, {
        new: true,
      }).exec();

      // If blog post is found send info to client.
      if (updatedBlogPost) {
        deleteImagesFromLocal(files);
        res.status(201).send("Post updated.");
      } else {
        deleteImagesFromLocal(files);
        res.status(404).send("Blog post not found.");
      }
    }),
  ],

  // Delete a blog post
  deleteBlogPost: [
    verifyIfAuthor,
    asyncHandler(async function (req, res, next) {
      const { postId } = req.params;
      // Verify if invalid Id
      if (verifyIdInvalid(postId)) {
        // Send a not found error.
        res.status(404).json({ message: "Post not found." });
      } else {
        // Fetch and delete blog post.
        const deletedPost = await Post.findByIdAndDelete(postId).exec();
        if (deletedPost) {
          // Send post if successfully deleted.
          res.status(200).json({
            message: `Deleted "${deletedPost.content[0].title}"`,
          });
        } else {
          // Send a not found error.
          res.status(404).json({ message: "Post not found." });
        }
      }
    }),
  ],

  // Middleware for getting comment list.
  blogPostComments: [
    verifyUnpublishedAccess,
    asyncHandler(async function (req, res, next) {
      // Get post.
      const post = res.locals.post;

      // Fetch comments.
      const comments = await Comment.find({ blogPost: post._id })
        .populate({ path: "commenter", select: "name" })
        .sort({ date: -1 })
        .lean()
        .exec();

      // Send comment list.
      if (comments.length > 0) {
        res.status(200).json(comments);

        // Send info if there are not comments yet.
      } else {
        res.status(404).json({ message: "There are no comments yet." });
      }
    }),
  ],

  // Handle create comment POST req.
  createComment: [
    verifyUnpublishedAccess,
    // Validate and sanitize.
    ...validate.comment,
    checkValidation,
    asyncHandler(async function (req, res, next) {
      // verify if user is logged in.
      if (req.user) {
        // Query blog post
        const post = res.locals.post;
        // send error if post not found.
        if (post) {
          // Create and save a comment if post is found.
          const comment = new Comment({
            text: req.body.comment,
            commenter: req.user.id,
            date: new Date(),
            blogPost: post.id,
          });
          await comment
            .save()

            // Send the created comment is success
            .then(async () => {
              const allComments = await Comment.find({
                blogPost: post._id,
              }).exec();
              // Update total comments
              const updatedTotalComments = new Post({
                _id: post._id,
                totalComments: allComments.length,
              });
              await Post.findByIdAndUpdate(post.id, updatedTotalComments, {
                new: true,
              }).exec();
              res.send(201).json(comment);
            })

            // Catch error if failure.
            .catch(() => {
              next(createHttpError(500, "Internal server error."));
            });

          // Send a post not found error.
        } else {
          res.status(404).send("Post not found.");
        }
        // Send forbidden if user is logged out.
      } else {
        res.status(403).send("Request forbidden.");
      }
    }),
  ],

  // Handle edit comment for the specified post.
  editComment: [
    verifyUnpublishedAccess,
    // Validate and sanitize.
    ...validate.comment,
    checkValidation,
    asyncHandler(async function (req, res, next) {
      // Get comment Id.
      const { commentId } = req.params;

      // Check if valid id
      if (verifyIdInvalid(commentId)) {
        res.status(404).send("Comment not found.");
      } else {
        // If user is logged in.
        if (req.user) {
          // Get comment.
          const oldComment = await Comment.findById(commentId).exec();

          // If comment is found.
          if (oldComment) {
            // Check if the commenter is the same with the logged in user.
            if (
              req.user._id.toString() === oldComment.commenter._id.toString()
            ) {
              // Create new comment.
              const comment = new Comment({
                ...oldComment,
                text: req.body.comment,
                date: new Date(),
              });

              // Edit previous comment.
              const updatedComment = await Comment.findByIdAndUpdate(
                oldComment._id,
                comment,
                { new: true }
              ).exec();

              if (updatedComment) {
                // Send details.
                res.status(200).json({
                  id: comment._id,
                  updatedFrom: oldComment.text,
                  updatedTo: updatedComment.text,
                });
              } else {
                res.status(404).send("Comment not found.");
              }

              // Send Unauthorized request.
            } else {
              res.send(401).send("Request unauthorized.");
            }

            // Send a not found comment.
          } else {
            res.status(404).send("Comment not found.");
          }

          // Send forbidden if user is logged out.
        } else {
          res.status(403).send("Request forbidden.");
        }
      }
    }),
  ],

  // Handle publish post req.
  publishPost: [
    verifyIfAuthor,
    ...validate.publish,
    checkValidation,
    asyncHandler(async function (req, res, next) {
      const { postId } = req.params;
      // Check if valid id.
      if (verifyIdInvalid(postId)) {
        res.status(404).send("Post not found.");
        return;
      }

      const oldPost = await Post.findById(postId).lean().exec();
      // Create a post with updated status
      const updateForPost = new Post({
        ...oldPost,
        isPublished: req.body.publish === "yes" ? true : false,
        publishedDate: oldPost?.isPublished === false ? new Date() : undefined,
      });

      // update Post
      const updatedPost = await Post.findByIdAndUpdate(postId, updateForPost, {
        new: true,
      }).exec();
      // Check if the post is found.
      if (updatedPost) {
        // Send success status.
        const postStatus =
          updatedPost.isPublished === true
            ? "Post published."
            : "Post unpublished.";
        res.status(200).send(postStatus);
      } else {
        // Return a not found error.
        res.status(404).send("Post not found.");
      }
    }),
  ],

  // Handle delete comment for the specified post.
  deleteComment: [
    verifyUnpublishedAccess,
    asyncHandler(async function (req, res, next) {
      const { commentId } = req.params;

      // Return comment not found if invalid Id.
      if (verifyIdInvalid(commentId)) {
        res.status(404).send("Comment not found.");
        return;
      }

      // Check if user is logged in.
      if (req.user) {
        const comment = await Comment.findById(commentId).exec();

        // Check if comment is found.
        if (comment) {
          // Check if the logged in user and the commenter is the same.
          if (req.user._id.toString() === comment.commenter._id.toString()) {
            const post = res.locals.post;
            // Delete the comment.
            const deletedComment = await Comment.findByIdAndDelete(
              commentId
            ).exec();
            if (deletedComment) {
              // Get total comments of the post.
              const totalComments = await Comment.find({
                blogPost: post._id,
              }).exec();
              const postTotalComments = new Post({
                _id: post._id,
                totalComments: totalComments.length,
              });

              // Update Blog Post comment.
              await Post.findByIdAndUpdate(post._id, postTotalComments, {
                new: true,
              }).exec();

              // Send success.
              res.status(200).send("Comment deleted.");
            } else {
              // Send error.
              res.status(500).send("Failed to delete comment.");
            }
          } else {
            // Send req unauthorize.
            res.status(401).send("Request Unauthorize");
          }
        } else {
          // Send a comment not found.
          res.status(404).send("Comment not found.");
        }
      } else {
        // Send forbidden if user is not logged in.
        res.status(403).send("Request Forbidden.");
      }
    }),
  ],
};

export default postController;
