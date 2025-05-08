import lume from "lume/mod.ts";
import blog from "blog/mod.ts";

import "npm:prismjs@1.29.0/components/prism-rust.js";
import "npm:prismjs@1.29.0/components/prism-python.js";

const site = lume(
  {
    server:{
      port: 80
    }
  }
);


site.use(blog());

export default site;
