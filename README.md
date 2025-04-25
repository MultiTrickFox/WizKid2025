

# The Stack
`main.mjs` is a pure node.js + express + mongodb stack.
The dashboard is hosted on digitalocean at `https://run-fox-run-q28ow.ondigitalocean.app/`

# How to Run
1) `npm install` the packages
2) make sure your `env` has valid secrets for: `mongo_connect`, `openai_key`
3) run with `npm main.mjs`

# Data Structure
Each entry of the `wiz` collection has:
1) User :: string
2) Pass :: string
3) Name :: string
4) Type :: string - admin/wizkid
5) Role :: string - boss/developer/designer/intern
6) Email :: string
7) ProfilePicture :: string url
8) Entry :: string - date of addition
9) Exit :: string - date of firing

# Default Users
`main.js` re-creates a default database at each run, using `setupDefaultCollection()`
The default users are:
1) admin-wowow
2) wizkid1-pass123
3) wizkid2-pass123
...

# App Structure
`main.mjs` is the backend
`backend.js` is the middle-end for purely HTML importable functions.
`index.html` and `test.html` are purely HTML - CSS - JS with Tailwind.

# Unique Idea
Let all wizkids have a personalizable "About Me" that is multidimensional, not just work related.
We can input their **Past Projects** , **Personality Traits** , **Unique Design Aspects** etc
Then an incoming guest/customer could openly search **Which Wizkid They Want to Connect With**
Or even better, they can just input their **Company URL** and we intelligently parse who could fit them best.
