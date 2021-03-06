const mongoose = require("mongoose");
const Pusher = require("pusher");
const Notification = require("../models/Notification");
const transporter = require("../helpers/smtpConfig");
const domain = "strictlysocial.herokuapp.com"
const Post = require("../models/Post");
const postColumns = "name email avatar imageData imageName";

const pusher = new Pusher({
  appId: "1194970",
  key: "7dc61c61506f7d658f25",
  secret: "be95880ca8e13c4bebf8",
  cluster: "ap2",
  useTLS: true,
});

const sendEmail = async (tmpl, data) => {
  var mailOptions = {
    to: data.receiver.email,
    from: "StrictlySocial",
    subject: "Notifications",
    html: `Hi ${data.sender.name}, 
    <br /> <br />
    ${tmpl}
    <br /><br /><br /><br />
    Thanks<br /><br />
    StrictlySocial`,
    text: `Hi, 

    ${tmpl}
    
    Thanks
    StrictlySocial`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) throw error;
    // res.send("Password reset link has been sent to your email!");
  });
};

function notificationTemplate(data) {
  if (data.action === "like") {
    return `<a href="https://${domain}/profile/${
      data.sender._id
    }" target="_blank">${
      data.sender.name
    }</a> liked your post <a href="https://${domain}/post/${
      data.post._id
    }" target="_blank">${
      data.post.text ? data.post.text.substring(0, 50) : "Image"
    }</a>`;
  } else if (data.action === "comment") {
    return `<a href="https://${domain}/profile/${
      data.sender._id
    }" target="_blank">${
      data.sender.name
    }</a> commented on your post <a href="https://${domain}/post/${
      data.post._id
    }" target="_blank">${
      data.post.text ? data.post.text.substring(0, 50) : "Image"
    } </a>`;
  } else if (data.action === "share") {
    return `<a href="https://${domain}/profile/${
      data.sender._id
    }" target="_blank">${
      data.sender.name
    }</a> shared your post <a href="https://${domain}/post/${
      data.post._id
    }" target="_blank">${
      data.post.text ? data.post.text.substring(0, 50) : "Image"
    }</a>`;
  } else if (data.action === "tag") {
    return `<a href="https://${domain}/profile/${
      data.sender._id
    }" target="_blank">${
      data.sender.name
    }</a> tagged you in the <a href="https://${domain}/post/${
      data.post._id
    }" target="_blank">post ${
      data.post.text ? data.post.text.substring(0, 50) : "Image"
    }</a>`;
  } else if (data.action === "mention") {
    return `<a href="https://${domain}/profile/${
      data.sender._id
    }" target="_blank">${
      data.sender.name
    }</a> mentioned you in the post <a href="https://${domain}/post/${
      data.post._id
    }" target="_blank">${
      data.post.text ? data.post.text.substring(0, 50) : "Image"
    }</a>`;
  } else if (data.action === "follow") {
    return `<a href="https://${domain}/profile/${data.sender._id}" target="_blank">${data.sender.name}</a> started following you`;
  } else {
    return "";
  }
}

const notifyUsers = async () => {
  const db = mongoose.connection;
  db.once("open", () => {
    const notificationsCollection = db.collection("notifications");
    const notificationChangeStream = notificationsCollection.watch();
    notificationChangeStream.on("change", async (change) => {
      if (change.operationType === "insert") {
        const notification = change.fullDocument;
        const nss = await Notification.findOne({ _id: notification._id })
          .populate({ path: "sender", select: "_id name" })
          .populate({ path: "receiver", select: "_id name email" })
          .populate({ path: "post", select: "_id text" });
        try {
          pusher.trigger(
            "notifications",
            "inserted",
            nss
          );
          sendEmail(notificationTemplate(nss), nss);
        } catch (error) {
          console.log("Error in sending notifications", error.message);
        }
      }
    });

    const postsCollection = db.collection("posts");
    const postsChangeStream = postsCollection.watch();
    postsChangeStream.on("change", async (change) => {
      if (change.operationType === "update") {
        const post = change.documentKey;
        const apost = await Post.findById({ _id: post._id })
        .populate("owner", "name email")
        .populate({ path: "user", select: postColumns })
        .populate({ path: "comments.user", select: postColumns });
        pusher.trigger(
          "posts",
          "updated",
          apost
        );
      } else if (change.operationType === "delete") {
        const post = change.documentKey;
        pusher.trigger(
          "posts",
          "deleted",
          {_id: post._id}
        );
      } else if (change.operationType === "insert") {
        const post = change.fullDocument;
        const apost = await Post.findById({ _id: post._id })
        .populate("owner", "name email")
        .populate({ path: "user", select: postColumns })
        .populate({ path: "comments.user", select: postColumns });
        pusher.trigger(
          "posts",
          "inserted",
          apost
        );
      }
    })
  });
};
module.exports = notifyUsers;
