

# The Stack
`main.mjs` is a pure node.js + express + mongodb stack. With no middleware, and manual headers are handling.
The stack is hosted on digitalocean at `https://run-fox-run-q28ow.ondigitalocean.app/`

# How to Run
1) `npm install` the packages
2) make your your `env` has valid string secrets for: `mongo_connect`, `openai_key`
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

# Backend.js
For where the frontend meets the backend, See the `backend.js`
This can be simply imported into an HTML and be used. The functions are available cleanly.

# Ideas:
- Give a free flow "Description" field, an external user can reach their personalized connection in the company.
- Given the free flow "Description" field, we create an interesting avatar image for you, your Persona symbol :)

