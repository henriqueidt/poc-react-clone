import React from "react";
import "./index.css";

import { DOMHandlers, useState } from "cloned-react";

const rootElement = document.getElementById("root");

const root = DOMHandlers.createRoot(rootElement);

const ChildComponent = () => {
  const [count, setCount] = useState(1);
  const [count2, setCount2] = useState(2);

  const onClick = () => {
    console.log("CLICK");
    setCount(count + 1);
  };

  return (
    <div>
      <div>{count}</div>
      <div>{count2}</div>
      <button onClick={onClick}>Increment1</button>
      <button onClick={() => setCount2(count2 + 1)}>Increment 2</button>
    </div>
  );
};

const AnotherComponent = () => {
  console.log(
    "Another component should not be called when ChildComponent state changes!!!"
  );
  return <div>Another component</div>;
};

const FirstComponent = ({ title }) => {
  return (
    <div className="123">
      adasd
      {title}
      <span>{title}</span>
      <ChildComponent />
      <AnotherComponent />
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
//       {/* {null} */}
//     </div>
//     {true && "value with true"}
//     {false}
//     {/* {undefined} */}
//     {/* {null} */}
//   </div>
// );

root.render(<FirstComponent title="this is a title" />);
