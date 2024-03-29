import React from "react";
import "./index.css";

import { DOMHandlers } from "cloned-react";

const rootElement = document.getElementById("root");

const root = DOMHandlers.createRoot(rootElement);
// DON'T FORGET
// You can replace the div here by another tag, for example a span, to make sure your code is fully working!
root.render(<div id="123">asdasd</div>);
