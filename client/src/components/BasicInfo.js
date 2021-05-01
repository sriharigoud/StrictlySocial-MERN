import React, { useEffect, useState } from "react";
import { doLogin } from "../utils/utils";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";
import { Image, Transformation } from "cloudinary-react";
import { Link } from "react-router-dom";
import Explore from "./Explore";
export default function BasicInfo({
  userInfo,
  setUserInfo,
  setCurrentUser,
  currentUser,
  hideProfileInfoSmallDevices,
}) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState(userInfo.bio);
  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const toggleFollow = async (userInfo) => {
    try {
      const res = await axios.put(`/api/users/follow/${userInfo._id}`);
      setUserInfo({ ...userInfo, followers: res.data.followers });
      setCurrentUser({
        ...currentUser,
        following: res.data.following.map((u) => u._id),
      });
      doLogin({
        ...currentUser,
        following: res.data.following.map((u) => u._id),
      });
    } catch (error) {
      console.log(error.message);
      if (typeof error.message === "string") {
        alert(error.message);
      }
    }
  };

  const saveProfile = async () => {
    try {
      let imageFormObj = new FormData();
      //if (file) {
      imageFormObj.append("imageName", Date.now() + "postimage");
      imageFormObj.append("imageData", file);
      // }
      imageFormObj.append("text", value);
      const res = await axios.post(`/api/users/`, imageFormObj, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setUserInfo({
        ...userInfo,
        bio: res.data.bio,
        imageName: res.data.imageName,
        imageData: res.data.imageData,
      });
      setCurrentUser({
        ...currentUser,
        bio: res.data.bio,
        imageName: res.data.imageName,
        imageData: res.data.imageData,
      });
      doLogin({
        ...currentUser,
        bio: res.data.bio,
        imageName: res.data.imageName,
        imageData: res.data.imageData,
      });
      handleClose();
    } catch (error) {
      console.log(error.message);
      if (error.response) {
        alert(error.response.data);
      }
    }
  };
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleEdit = () => {
    handleShow();
  };
  const [file, setFile] = useState();
  const fileChangedHandler = (event) => {
    setFile(event.target.files[0]);
  };

  useEffect(() => {
    setValue(userInfo.bio);
  }, [userInfo]);

  return (
    <React.Fragment>
      <div
        className={
          !hideProfileInfoSmallDevices ? "card" : "card d-none d-md-block"
        }
      >
        <div style={{ position: "relative" }} className="userContainer">
          {userInfo.imageName === "none" && (
            <img className="w-100" src={userInfo.avatar} alt={userInfo.name} />
          )}
          {userInfo.imageName !== "none" && (
            <Image
            responsive
              placeholderColor="red"
              cloudName={"strictlysocial"}
              publicId={userInfo.imageName}
            >
              <Transformation
                width="300"
                height="300"
                gravity="faces"
                crop="fill"
              />
            </Image>
          )}
         
          {/* </a> */}
          {/* </SRLWrapper> */}
          {currentUser && currentUser._id === userInfo._id && (
            <button
              className="btn btn-primary w-50 m-auto editProfile"
              onClick={() => handleEdit()}
            >
              Edit Profile
            </button>
          )}
          {currentUser &&
            currentUser._id !== userInfo._id &&
            userInfo._id !== "608438c33383641df099002a" && (
              <button
                onClick={() => toggleFollow(userInfo)}
                className="btn btn-primary w-50 m-auto editProfile"
              >
                {userInfo.followers &&
                userInfo.followers.some(
                  (className) => className._id === currentUser._id
                )
                  ? " Unfollow"
                  : " Follow"}
              </button>
            )}
        </div>
        <div className="card-body px-3 py-1 pb-0">
          <div className="h5 my-0 heading">
            <Link
              style={{ textDecoration: "none" }}
              to={`/profile/${userInfo._id}`}
            >
              {userInfo.name}
            </Link>
          </div>
          <div className="h7 my-0 text-muted">
            {userInfo.email && "@" + userInfo.email.split("@")[0]}
          </div>
          {/* <div className="h7">{userInfo.bio}</div> */}
        </div>
        {/* <ul className="list-group border-0 mt-0 px-2 pt-0 list-group-flush">
        <li className="list-group-item my-0 py-2 px-1">
          <a href="#home">
            <i className="fa fa-fw fa-home"></i> Home
          </a>
        </li>
        <li className="list-group-item my-0 py-2 px-1">
          <a href="#home">
            <i className="fa fa-fw fa-home"></i> Explore
          </a>
        </li>
        <li className="list-group-item my-0 py-2 px-1">
          <a href="#home">
            <i className="fa fa-fw fa-home"></i> Notifications
          </a>
        </li>
        <li className="list-group-item my-0 py-2 px-1">
          <a href="#home">
            <i className="fa fa-fw fa-home"></i> Profile
          </a>
        </li>
      </ul> */}

        {/* <ul className="list-group d-none d-md-block list-group-flush">
        <li className="list-group-item">
          <div className="h6 text-muted">Followers</div>
          <div className="h5">
            {userInfo.followers ? userInfo.followers.length : 0}
          </div>
        </li>
        <li className="list-group-item">
          <div className="h6 text-muted">Following</div>
          <div className="h5">
            {userInfo.following ? userInfo.following.length : 0}
          </div>
        </li>
      </ul> */}
        <Modal show={show} onHide={handleClose}>
          <Modal.Body>
            <Form.Group controlId="exampleForm.ControlTextarea1">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                value={value}
                onChange={handleChange}
                as="textarea"
                rows={3}
              />
            </Form.Group>
            <Form.Group>
              <Form.File
                onChange={fileChangedHandler}
                id="exampleFormControlFile1"
                label="Profile Photo"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={saveProfile}>
              Save & Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <Explore />
      </React.Fragment>
  );
}
