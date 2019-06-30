import React, { useState } from "react";
import { connect } from "react-redux";
import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import Image from "semantic-ui-react/dist/es/elements/Image/Image";
import Dropdown from "semantic-ui-react/dist/es/modules/Dropdown/Dropdown";
import DropdownMenu from "semantic-ui-react/dist/es/modules/Dropdown/DropdownMenu";
import DropdownHeader from "semantic-ui-react/dist/es/modules/Dropdown/DropdownHeader";
import DropdownItem from "semantic-ui-react/dist/es/modules/Dropdown/DropdownItem";
import Button from "semantic-ui-react/dist/es/elements/Button/Button";
import ButtonContent from "semantic-ui-react/dist/es/elements/Button/ButtonContent";
import Icon from "semantic-ui-react/dist/es/elements/Icon/Icon";
import Loader from "semantic-ui-react/dist/es/elements/Loader/Loader";
import Title from "semantic-ui-react/dist/es/elements/Header/Header";
import { Link } from "react-router-dom";
import { css } from "linaria";
import { USER_LOGGED_IN, USER_LOGGED_OUT, USER_PENDING } from "../actions/user";
import "semantic-ui-css/components/segment.min.css";
import "semantic-ui-css/components/image.min.css";
import "semantic-ui-css/components/dropdown.min.css";
import "semantic-ui-css/components/button.min.css";
import "semantic-ui-css/components/icon.min.css";
import "semantic-ui-css/components/loader.min.css";
import "semantic-ui-css/components/header.min.css";
import "semantic-ui-css/components/menu.min.css";
import "semantic-ui-css/components/transition.min.css";

const githubColors = css`
  color: #333 !important;
  box-shadow: 0 0 0 1px #333 inset !important;
`;

const Login = () => {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      animated
      basic
      loading={loading}
      className={githubColors}
      onClick={() => {
        setLoading(true);
        window.location = `${
          process.env.NODE_ENV === `development` ? `//localhost:9005` : ``
        }/g`;
      }}>
      <ButtonContent visible>Login with Github</ButtonContent>
      <ButtonContent hidden>
        <Icon name={`github`} />
      </ButtonContent>
    </Button>
  );
};

const User = ({ user }) => (
  <Dropdown
    icon={<Image src={user.image} size={`mini`} />}
    direction={`left`}
    className={DisableTextBlock}>
    <DropdownMenu>
      <DropdownHeader>{user.name}</DropdownHeader>
      <DropdownItem
        onClick={() =>
          (window.location = `${
            process.env.NODE_ENV === `development` ? `//localhost:9005` : ``
          }/g/logout`)
        }>
        Logout
      </DropdownItem>
    </DropdownMenu>
  </Dropdown>
);

function mapStateToProps(state) {
  const { user } = state;
  return { user };
}

const FlexBox = css`
  display: flex;
  align-items: center;
`;
const FlexItem = css`
  flex: 0 0 auto;
`;
const FlexSpacer = css`
  flex: 1 1 auto;
`;
const DisableTextBlock = css`
  & > .text {
    display: inline !important;
  }
`;

export const Header = connect(mapStateToProps)(({ user }) => (
  <Segment className={FlexBox}>
    <div className={FlexItem}>
      <Title
        as={Link}
        to={`/`}
        image={
          <Image
            src={`https://rewarecdn.a1motion.com/intramural/logo.png?width=64`}
            size={`mini`}
            inline
          />
        }
        content={`Intramural`}
      />
    </div>
    <div className={FlexSpacer} />
    <div className={FlexItem}>
      {user.status === USER_PENDING && <Loader />}
      {user.status === USER_LOGGED_IN && <User user={user.payload} />}
      {user.status === USER_LOGGED_OUT && <Login />}
    </div>
  </Segment>
));
