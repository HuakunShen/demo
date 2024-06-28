This shows how to build a iife bundle with vite.

```
❯ tree dist
dist
├── assets
│   └── react-CHdo91hT.svg
├── index.html
├── index.js
└── vite.svg
```

This iife can be inserted into the iframe in a website.

## Example

- Host `demo.html` on `http://localhost:5500`
- `serve dist --cors` to serve the iife bundle on `http://localhost:3000`.
  - The js file can be accessed on `http://localhost:3000/index.js`

```html
<iframe
  width="500"
  height="500"
  class="border-2 border-red-500"
  frameborder="0"
></iframe>
<script>
  const iframe = document.querySelector("iframe");
  console.log(iframe);
  const currentWindow = iframe.contentWindow;
  currentWindow.document.body.innerHTML = '<div id="root"></div>';
  fetch("http://localhost:3000/index.js")
    .then((res) => res.text())
    .then((js) => {
      currentWindow.eval(js);
    });
</script>
```

The drawback of this method is that the image assets isn't bundled into the js. The svg is missing in the file.