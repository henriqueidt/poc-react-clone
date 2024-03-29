import React from "react";
import "./index.css";

import { DOMHandlers } from "cloned-react";

const rootElement = document.getElementById("root");

const root = DOMHandlers.createRoot(rootElement);

root.render(
  <div id="123" aria-label="test">
    <div className="asdasd">{123}</div>
    <div className="asdasd">
      <div>{123}</div>
      <div>asdasd</div>
      <div>asdasd</div>
      {true && "value with true"}
      {false && "value with false"}
      {undefined}
      {null}
    </div>
    {true && "value with true"}
    {false}
    {undefined}
    {null}
  </div>
);
