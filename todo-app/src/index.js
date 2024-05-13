import React from "react";
import "./index.css";

import { DOMHandlers, useState } from "cloned-react";

const rootElement = document.getElementById("root");

const root = DOMHandlers.createRoot(rootElement);

const ChildComponent = () => {
  const [count, setCount] = useState(1);
  const [count2, setCount2] = useState(2);
  const [count3, setCount3] = useState(3);
  const [title, setTitle] = useState("this is a title");

  const onClick = () => {
    setCount(undefined);
  };

  const onClick2 = () => {
    setCount2(<div>asdasd</div>);
  };

  const onClick3 = () => {
    setCount3((prev) => prev + 1);
  };

  const onClick4 = () => {
    setTitle("updated title");
  };

  return (
    <div>
      <div>{count}</div>
      <div>{count2}</div>
      <div>{count3}</div>
      <ComponentWithProps title={title} />
      <button onClick={onClick}>remove first</button>
      <button onClick={onClick2}>replace second</button>
      <button onClick={onClick3}>Increment 3</button>
      <button onClick={onClick4}>Update fourth props</button>
    </div>
  );
};

const ComponentWithProps = ({ title }) => {
  return <div>{title}</div>;
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
