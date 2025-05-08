import lume from "lume/mod.ts";
import blog from "blog/mod.ts";

import "npm:prismjs@1.29.0/components/prism-rust.js";
import "npm:prismjs@1.29.0/components/prism-python.js";
import "npm:prismjs@1.29.0/components/prism-bash.js";
import "npm:prismjs@1.29.0/components/prism-nasm.js";

const site = lume(
  {
    server:{
      port: 8000
      debugBar: false,
    }
  }
);
site.add("/img");


site.use(blog());

export default site;
