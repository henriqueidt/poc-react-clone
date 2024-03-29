import React from "react";
import "./index.css";

import { DOMHandlers } from "cloned-react";

const rootElement = document.getElementById("root");

const root = DOMHandlers.createRoot(rootElement);

const FirstComponent = ({ title }) => {
  return (
    <div className="123">
      adasd
      {title}
      <span>{title}</span>
    </div>
  );
};

// THIS IS RENDERING CORRECTLY
// root.render(
//   <div id="123" aria-label="test">
//     <div className="asdasd">{123}</div>
//     <div className="asdasd">
//       <div>{123}</div>
//       <div>asdasd</div>
//       <div>asdasd</div>
//       {true && "value with true"}
//       {false && "value with false"}
//       {undefined}
//       {null}
//     </div>
//     {true && "value with true"}
//     {false}
//     {undefined}
//     {null}
//   </div>
// );

root.render(<FirstComponent title="this is a title" />);
