

# Each entry in the 'wiz' collection has the following structure:

- User - string
- Pass - string
- Name - string
- Type - string - admin/wizkid
- Role - string - boss/developer/designer/intern
- Email - string
- Profile picture - string base64
- Persona picture - string base64
- Entry - string - date of addition
- Exit - string - date of firing



# main.js `setupDefaultCollection()` is for populating the database:
creates 1 admin and 3 users -> 'admin'-'wowow' , 'wizkid1'-'pass123' , 'wizkid2'-'pass456', 'wizkid3'-'pass789'




# Ideas:

- Give a free flow "Description" field, then given a "Query" the LLM can search for it across everyone

- Given the free flow "Description" field, we create the image for you, the Persona picture :)




