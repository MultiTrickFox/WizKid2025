import fetch from 'node-fetch';
import express from 'express';
import mongodb from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

if (!process.env.mongo_connect) {
    throw new Error('MONGO_CONNECT environment variable is not defined');
}

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for browser-based testing

// Single MongoDB client instance
const mongo_client = new mongodb.MongoClient(process.env.mongo_connect);
await mongo_client.connect();
const mongo_db = mongo_client.db('main');
const db_wiz = mongo_db.collection('wiz');

// Serve static files and HTML
app.use('/static', express.static(process.cwd() + '/static'));
app.get('/', (req, res) => res.sendFile(process.cwd() + '/index.html'));
app.get('/test.html', (req, res) => res.sendFile(process.cwd() + '/test.html'));
app.get('/backend.js', (req, res) => res.sendFile(process.cwd() + '/backend.js'));

// Utility function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return string.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/i);
    } catch (_) {
        return false;
    }
}

// 1) View all wizkids (GET /view_wizkids)
app.get('/view_wizkids', async (req, res) => {
    try {
        let userType = 'guest';

        if (req.headers['user'] && req.headers['pass']) {
            let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
            if (!authUser) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            userType = authUser.Type;
        }

        let wizkids = await db_wiz.find({}).toArray();

        if (userType === 'admin' || userType === 'wizkid') {
            return res.status(200).json(wizkids.map(wizkid => {
                let { Pass, ...rest } = wizkid;
                return rest;
            }));
        } else { // guest
            return res.status(200).json(wizkids.map(wizkid => ({
                Name: wizkid.Name,
                ProfilePicture: wizkid.ProfilePicture,
                Description: wizkid.Description
            })));
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2) Admin update wizkid information (PUT /update_wizkid)
app.put('/update_wizkid', async (req, res) => {
    try {
        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update wizkid information' });
        }

        let { wizkidUser, ...updateData } = req.body;
        if (!wizkidUser) {
            return res.status(400).json({ error: 'wizkidUser is required' });
        }

        // Validate ProfilePicture URL if provided
        if (updateData.ProfilePicture && !isValidUrl(updateData.ProfilePicture)) {
            return res.status(400).json({ error: 'ProfilePicture must be a valid URL' });
        }

        let result = await db_wiz.updateOne(
            { User: wizkidUser },
            { $set: { ...updateData, updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Wizkid not found' });
        }

        res.status(200).json({ success: true, message: 'Wizkid updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3) Wizkid update own information (PUT /update_own_info)
app.put('/update_own_info', async (req, res) => {
    try {
        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'wizkid') {
            return res.status(403).json({ error: 'Only wizkids can update their own information' });
        }

        let updateData = req.body;

        // Only allow updates to Name, Email, Pass, ProfilePicture, and Description
        let safeUpdateData = {};
        if (updateData.Name) safeUpdateData.Name = updateData.Name;
        if (updateData.Pass) safeUpdateData.Pass = updateData.Pass;
        if (updateData.Email) safeUpdateData.Email = updateData.Email;
        if (updateData.ProfilePicture) {
            if (!isValidUrl(updateData.ProfilePicture)) {
                return res.status(400).json({ error: 'ProfilePicture must be a valid URL' });
            }
            safeUpdateData.ProfilePicture = updateData.ProfilePicture;
        }
        if (updateData.Description) safeUpdateData.Description = updateData.Description;

        let result = await db_wiz.updateOne(
            { User: req.headers['user'] },
            { $set: { ...safeUpdateData, updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Wizkid not found' });
        }

        res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4) Admin delete wizkid (DELETE /delete_wizkid)
app.delete('/delete_wizkid', async (req, res) => {
    try {
        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            return res.status(403).json({ error: 'Only admins can delete wizkids' });
        }

        let { wizkidUser } = req.body;
        if (!wizkidUser) {
            return res.status(400).json({ error: 'wizkidUser is required' });
        }

        let result = await db_wiz.deleteOne({ User: wizkidUser });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Wizkid not found' });
        }

        res.status(200).json({ success: true, message: 'Wizkid deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5) Admin fire wizkid (POST /fire_wizkid)
app.post('/fire_wizkid', async (req, res) => {
    try {
        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            return res.status(403).json({ error: 'Only admins can fire wizkids' });
        }

        let { wizkidUser } = req.body;
        if (!wizkidUser) {
            return res.status(400).json({ error: 'wizkidUser is required' });
        }

        let result = await db_wiz.updateOne(
            { User: wizkidUser, Exit: { $exists: false } },
            { $set: { Exit: new Date().toISOString(), updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Wizkid not found or already fired' });
        }

        res.status(200).json({ success: true, message: 'Wizkid fired successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6) Admin unfire wizkid (POST /unfire_wizkid)
app.post('/unfire_wizkid', async (req, res) => {
    try {
        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            return res.status(403).json({ error: 'Only admins can unfire wizkids' });
        }

        let { wizkidUser } = req.body;
        if (!wizkidUser) {
            return res.status(400).json({ error: 'wizkidUser is required' });
        }

        let result = await db_wiz.updateOne(
            { User: wizkidUser, Exit: { $exists: true } },
            { $unset: { Exit: "" }, $set: { updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Wizkid not found or not fired' });
        }

        res.status(200).json({ success: true, message: 'Wizkid unfired successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7) Search wizkids by description (POST /search_wizkids)
app.post('/search_wizkids', async (req, res) => {
    try {
        let userType = 'guest';

        // Authenticate user
        if (req.headers['user'] && req.headers['pass']) {
            let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
            if (!authUser) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            userType = authUser.Type;
        }

        // Validate query
        const { query } = req.body;
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({ error: 'Query is required and must be a non-empty string' });
        }

        // Get all users
        const wizkids = await db_wiz.find({}).toArray();

        // Use GPT to find best matching wizkid
        const descriptions = wizkids.map((w, i) => `#${i}: ${w.Description || 'No description'}`).join('\n');

        const prompt = `
You are an intelligent assistant. Based on the following list of numbered wizkid descriptions, return the number of the one that best matches this query: "${query}". Make sure you return at least one answer that's closest. Respond with only the number, nothing else.

Descriptions:
${descriptions}
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.openai_key}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
		console.log("ClosedAI Output:",data.choices[0].message.content)
        const matchIndex = parseInt(data.choices[0].message.content.match(/\d+/)?.[0]);
        const bestMatch = wizkids[matchIndex];

        if (!bestMatch) {
            return res.status(404).json({ error: 'No matching wizkid found' });
        }

        // Return data based on user type
        if (userType === 'admin' || userType === 'wizkid') {
            const { Pass, ...rest } = bestMatch;
            return res.status(200).json(rest);
        } else { // guest
            return res.status(200).json({
                Name: bestMatch.Name,
                ProfilePicture: bestMatch.ProfilePicture,
                Description: bestMatch.Description
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// app.post('/search_wizkids', async (req, res) => {
//     try {
//         let userType = 'guest';

//         // Authenticate user
//         if (req.headers['user'] && req.headers['pass']) {
//             let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
//             if (!authUser) {
//                 return res.status(401).json({ error: 'Invalid credentials' });
//             }
//             userType = authUser.Type;
//         }

//         // Validate query
//         const { query } = req.body;
//         if (!query || typeof query !== 'string' || query.trim().length === 0) {
//             return res.status(400).json({ error: 'Query is required and must be a non-empty string' });
//         }

//         // Get all users
//         const wizkids = await db_wiz.find({}).toArray();

//         // Simple keyword-matching search
//         const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
//         let bestMatch = null;
//         let maxScore = -1;

//         for (const wizkid of wizkids) {
//             const description = (wizkid.Description || '').toLowerCase();
//             let score = 0;
//             for (const word of queryWords) {
//                 if (description.includes(word)) {
//                     score += 1; // Increment score for each matching word
//                 }
//             }
//             if (score > maxScore) {
//                 maxScore = score;
//                 bestMatch = wizkid;
//             }
//         }

//         if (!bestMatch) {
//             return res.status(404).json({ error: 'No matching wizkid found' });
//         }

//         // Return data based on user type
//         if (userType === 'admin' || userType === 'wizkid') {
//             const { Pass, ...rest } = bestMatch;
//             return res.status(200).json(rest);
//         } else { // guest
//             return res.status(200).json({
//                 Name: bestMatch.Name,
//                 ProfilePicture: bestMatch.ProfilePicture,
//                 Description: bestMatch.Description
//             });
//         }
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// 8) Admin create wizkid (POST /create_wizkid)
app.post('/create_wizkid', async (req, res) => {
    try {
        // Authenticate admin
        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            return res.status(403).json({ error: 'Only admins can create wizkids' });
        }

        // Extract and validate input
        const { User, Pass, Name, Type, Role, Email, ProfilePicture, Description } = req.body;

        // Required fields
        if (!User || !Pass || !Name || !Type || !Role || !Email) {
            return res.status(400).json({ error: 'User, Pass, Name, Type, Role, and Email are required' });
        }

        // Validate Type
        if (Type !== 'wizkid') {
            return res.status(400).json({ error: 'Type must be "wizkid"' });
        }

        // Validate Email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email)) {
            return res.status(400).json({ error: 'Invalid Email format' });
        }

        // Check if User already exists
        const existingUser = await db_wiz.findOne({ User });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Validate ProfilePicture URL if provided
        if (ProfilePicture && !isValidUrl(ProfilePicture)) {
            return res.status(400).json({ error: 'ProfilePicture must be a valid URL' });
        }

        // Create new wizkid
        const newWizkid = {
            User,
            Pass, // TODO: Hash with bcrypt in production
            Name,
            Type,
            Role,
            Email,
            ProfilePicture: ProfilePicture || defaultProfilePicture,
            Description: Description || '',
            Entry: new Date().toISOString(),
            Exit: null,
            updatedAt: new Date().toISOString()
        };

        const result = await db_wiz.insertOne(newWizkid);

        res.status(201).json({ success: true, message: 'Wizkid created successfully', user: User });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Setup default collection with users
async function setupDefaultCollection() {

	const defaultProfilePicture = 'https://images.unsplash.com/photo-1725958789276-5fcdabb0a8ca?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm94fGVufDB8fDB8fHww';

    try {
        const db = mongo_db;
        const wiz_collection = db.collection('wiz');

        // Clear existing data (optional, comment out if not needed)
        await wiz_collection.deleteMany({});
        console.log('Cleared wiz collection');

        // Ensure unique index on User field
        await wiz_collection.createIndex({ User: 1 }, { unique: true });

        // Current timestamp for Entry
        const now = new Date().toISOString();

        // Admin user
        const admin = {
            User: 'admin',
            Pass: 'wowow', // TODO: Hash with bcrypt in production
            Name: 'Admin User',
            Type: 'admin',
            Role: 'boss',
            Email: 'admin@company.com',
            ProfilePicture: defaultProfilePicture,
            Description: 'As the lead administrator, I oversee the entire Wizkid platform, managing user accounts and ensuring smooth operations. With a background in software engineering and project management, I specialize in coordinating teams, resolving technical issues, and implementing scalable solutions. My passion for technology drives me to foster a collaborative environment where innovation thrives.',
            Entry: now,
            Exit: null,
            updatedAt: now
        };

        // Wizkid users
        const wizkids = [
            {
                User: 'wizkid1',
                Pass: 'pass123',
                Name: 'Alice Smith',
                Type: 'wizkid',
                Role: 'developer',
                Email: 'alice.smith@company.com',
                ProfilePicture: 'https://images.unsplash.com/photo-1595871465907-19020bb76ad1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8Mnw5NDUyNDk0fHxlbnwwfHx8fHw%3D',
                Description: 'Alice is a senior full-stack developer with over 7 years of experience in building web applications. Proficient in JavaScript, React, and Node.js, she excels at creating scalable APIs and user-friendly interfaces. Her recent projects include a real-time collaboration tool and a machine learning dashboard. Outside work, Alice enjoys mentoring junior developers and contributing to open-source projects.',
                Entry: now,
                Exit: null,
                updatedAt: now
            },
            {
                User: 'wizkid2',
                Pass: 'pass123',
                Name: 'Bob Johnson',
                Type: 'wizkid',
                Role: 'designer',
                Email: 'bob.johnson@company.com',
                ProfilePicture: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MTR8OTQ1MjQ5NHx8ZW58MHx8fHx8',
                Description: 'Bob is a creative UI/UX designer with a knack for crafting intuitive and visually appealing interfaces. With expertise in Figma, Adobe XD, and Tailwind CSS, he has designed user experiences for mobile apps and web platforms. Bob’s recent work includes a responsive e-commerce dashboard and a minimalist portfolio site. In his free time, he explores typography and color theory.',
                Entry: now,
                Exit: null,
                updatedAt: now
            },
            {
                User: 'wizkid3',
                Pass: 'pass123',
                Name: 'Charlie Brown',
                Type: 'wizkid',
                Role: 'intern',
                Email: 'charlie.brown@company.com',
                ProfilePicture: 'https://images.unsplash.com/photo-1592011159356-3a1f7c74e784?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MTZ8OTQ1MjQ5NHx8ZW58MHx8fHx8',
                Description: 'Charlie is a recent computer science graduate interning as a junior developer. Eager to learn, he has been contributing to backend services using Node.js and MongoDB. His internship project involves optimizing database queries for a user management system. Charlie is passionate about cloud computing and hopes to specialize in DevOps. He enjoys hackathons and tech meetups.',
                Entry: now,
                Exit: now, // Fired for testing
                updatedAt: now
            },
            {
                User: 'wizkid4',
                Pass: 'pass123',
                Name: 'Diana Lee',
                Type: 'wizkid',
                Role: 'developer',
                Email: 'diana.lee@company.com',
                ProfilePicture: 'https://images.unsplash.com/photo-1575439462433-8e1969065df7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MjB8OTQ1MjQ5NHx8ZW58MHx8fHx8',
                Description: 'Diana is an experienced backend developer specializing in microservices and cloud architecture. With proficiency in Python, Docker, and AWS, she has built robust APIs for fintech applications. Her recent project involved integrating a payment gateway with real-time fraud detection. Diana is an advocate for clean code and frequently speaks at tech conferences.',
                Entry: now,
                Exit: null,
                updatedAt: now
            },
            {
                User: 'wizkid5',
                Pass: 'pass123',
                Name: 'Evan Patel',
                Type: 'wizkid',
                Role: 'data scientist',
                Email: 'evan.patel@company.com',
                ProfilePicture: 'https://images.unsplash.com/photo-1550246140-29f40b909e5a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MjZ8OTQ1MjQ5NHx8ZW58MHx8fHx8',
                Description: 'Evan is a data scientist with a PhD in machine learning, focusing on predictive analytics and natural language processing. Using Python, TensorFlow, and SQL, he has developed models for customer segmentation and sentiment analysis. His current project involves building a recommendation engine for a content platform. Evan enjoys teaching data science workshops.',
                Entry: now,
                Exit: null,
                updatedAt: now
            },
            {
                User: 'wizkid6',
                Pass: 'pass123',
                Name: 'Fiona Chen',
                Type: 'wizkid',
                Role: 'product manager',
                Email: 'fiona.chen@company.com',
                ProfilePicture: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxjb2xsZWN0aW9uLXBhZ2V8MTB8OTQ1MjQ5NHx8ZW58MHx8fHx8',
                Description: 'Fiona is a product manager with a background in software development and business strategy. She excels at bridging technical and business teams to deliver user-centric products. Her recent work includes launching a SaaS platform for small businesses. Fiona is skilled in Agile methodologies and enjoys analyzing market trends to inform product roadmaps.',
                Entry: now,
                Exit: null,
                updatedAt: now
            }
        ];

        // Insert admin user
        const adminResult = await wiz_collection.insertOne(admin);
        console.log(`Inserted admin user with _id: ${adminResult.insertedId}`);

        // Insert wizkids
        const wizkidsResult = await wiz_collection.insertMany(wizkids);
        console.log(`Inserted ${wizkidsResult.insertedCount} wizkids`);

        // Verify inserted documents
        const allUsers = await wiz_collection.find({}).toArray();
        console.log('All users in wiz collection:', allUsers);
    } catch (error) {
        console.error('Error setting up wiz collection:', error);
        throw error;
    }
}

setupDefaultCollection().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});

// Start server
app.listen(3000, () => {
    console.log(`Server running on port ${3000}`);
});

// Close MongoDB connection on process exit
process.on('SIGINT', async () => {
    await mongo_client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});