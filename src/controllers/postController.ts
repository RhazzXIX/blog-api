import Post from "../models/post";
import Comment from "../models/comment";
import asyncHandler from "express-async-handler";
import verifyUnpublishedAccess from "../assists/middlewares/verifyUnpublishedAccess";
import verifyIfAuthor from "../assists/middlewares/verifyIfAuthor";
import validate from "../assists/middlewares/validate";
import checkValidation from "../assists/middlewares/checkValidation";
import verifyIdInvalid from "../assists/functions/verifyIdInvalid";
import createHttpError from "http-errors";

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
        .sort({ publishedData: -1 })
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
    // Validate and sanitize.
    ...validate.post,
    checkValidation,

    // Handle Create blog post req.
    asyncHandler(async function (req, res, next) {
      // Container for content
      const content: IPostContent[] = [];

      // Loop at the req.body
      for (let i = 1; i <= 4; i++) {
        // Check if there are entries
        if (req.body[`title${i}`]) {
          // Push entries to content for saving to database.
          content.push({
            headerImg: req.body[`headerImg${i}`] || undefined,
            title: req.body[`title${i}`],
            text: req.body[`body${i}`],
          } as IPostContent);
        }
      }

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

          // Send response if success.
          res.status(201).json(blogPost);
        })
        // If there are errors.
        .catch(async (err) => {
          // Delete the said post for preventing bloating the database.
          await Post.findByIdAndDelete(blogPost._id);
          next(err);
        });
    }),
  ],
  // Update a blog post.
  updateBlogPost: [
    verifyIfAuthor,
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

      // Container for updated content
      const updatedContent: IPostContent[] = [];

      // Loop at the req.body
      for (let i = 1; i <= 4; i++) {
        // Check if there are entries
        if (req.body[`title${i}`]) {
          // Push entries for saving to database.
          updatedContent.push({
            headerImg: req.body[`headerImg${i}`] || undefined,
            title: req.body[`title${i}`],
            text: req.body[`body${i}`],
          } as IPostContent);
        }
      }

      // Create a document for updating post.
      const blogPost = new Post({
        _id: postId,
        content: updatedContent,
      });

      // Query database and update.
      const updateBlogPost = await Post.findByIdAndUpdate(
        postId,
        blogPost,
        {}
      ).exec();

      // If blog post is found send info to client.
      if (updateBlogPost) {
        res.status(201).json({
          id: updateBlogPost._id,
          updateFrom: updateBlogPost.content,
          updateTo: blogPost.content,
        });
      } else {
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
              // Update total comments
              const updatedTotalComments = new Post({
                _id: post.id,
                totalComments: post.totalComments + 1,
              });
              await Post.findByIdAndUpdate(
                post.id,
                updatedTotalComments,
                {}
              ).exec();
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

  // Handle delete comment for the specified post.
};

export default postController;
