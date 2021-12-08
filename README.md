# JQL: a JQuery alike module

This library is inspired by the idea that some JQuery was too good 
[to ditch](http://youmightnotneedjquery.com/).

It is developed in a modular fashion and uses plain ES20xx, so not really suitable for older browsers.

It is *not* a replacement for [JQuery](https://github.com/jquery/jquery). 
Consider it a subset of JQuery <i>alike</i> methods for (collections of) HTML elements within a HTML document. 

To use the module in your browser script use:

```html
<script type="module">
  import $ from "https://cdn.jsdelivr.net/gh/KooiInc/JQL@master/lib/JQLBundle.js";
  // or (Note: jsdelivr source map is useless)
  import $ from "https://cdn.jsdelivr.net/npm/jqlmodule@latest/lib/JQLBundle.min.js";
  // or (note: JQueryLike.min.js will *not* work)
  import $ from "https://cdn.jsdelivr.net/gh/KooiInc/JQL@master/src/JQueryLike.js";
</script>
```

The module can also be installed from npm using `npm install jqlmodule`.

Explore this <a href="https://testbed.nicon.nl/JQLDemo/" target="_blank">demo/example</a>, 
or explore the <a href="https://kooiinc.github.io/JQLDoc" target="_blank">the code documentation</a>.

**Have fun!**
