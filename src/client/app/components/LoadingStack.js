import React from "react";

import Segment from "semantic-ui-react/dist/es/elements/Segment/Segment";
import Placeholder from "semantic-ui-react/dist/es/elements/Placeholder/Placeholder";
import PlaceholderParagraph from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderParagraph";
import PlaceholderLine from "semantic-ui-react/dist/es/elements/Placeholder/PlaceholderLine";

import "semantic-ui-css/components/segment.min.css";
import "semantic-ui-css/components/placeholder.min.css";

export default () =>
  new Array(8).fill(0).map((_, i) => (
    <Segment key={i}>
      <Placeholder fluid>
        <PlaceholderParagraph>
          <PlaceholderLine length={`full`} />
          <PlaceholderLine length={`full`} />
        </PlaceholderParagraph>
      </Placeholder>
    </Segment>
  ));
