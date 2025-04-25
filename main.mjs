import express from 'express';
import mongodb from 'mongodb';

//

const app = express();
app.use(express.json());

const mongo_client = new mongodb.MongoClient(process.env.mongo_connect)
await mongo_client.connect();
const mongo_db = mongo_client.db('main');
const db_wiz = mongo_db.collection('wiz');

//

app.use('/static', express.static(process.cwd()+'/static'))
app.get('/', (req, res) => res.sendFile(process.cwd()+'/index.html'))
app.get('/test.html', (req, res) => res.sendFile(process.cwd()+'/test.html'))
app.get('/backend.js', (req, res) => res.sendFile(process.cwd()+'/backend.js'))

//


// 1) View all wizkids (GET /view_wizkids)
app.get('/view_wizkids', async (req, res) => {
    try {

        let userType = 'guest';

        if (req.headers['user'] && req.headers['pass']) {
            let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
            if (!authUser) { throw new Error('Invalid credentials'); }
            userType = authUser.Type;
        }

        let wizkids = await db_wiz.find({}).toArray();
        
        if (userType == 'admin' || userType == 'wizkid') {
			return res.status(200).json(wizkids.map(wizkid => {
				let { Pass, ...rest } = wizkid;
				return rest;
			}));
        } else { // guest
			return res.status(200).json(wizkids.map(wizkid => ({
                Name: wizkid.Name,
                ProfilePicture: wizkid.ProfilePicture
            })));
		}

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 2) Admin update wizkid information (PUT /update_wizkid)
app.put('/update_wizkid', async (req, res) => {
    try {

        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            throw new Error('Only admins can update wizkid information');
        }

        let { wizkidUser, ...updateData } = req.body;

        let result = await db_wiz.updateOne(
            { User: wizkidUser },
            { $set: { ...updateData, updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            throw new Error('Wizkid not found');
        }

        res.status(200).json({ success: true, message: 'Wizkid updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 3) Wizkid update own information (PUT /update_own_info)
app.put('/update_own_info', async (req, res) => {
    try {
		
        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'wizkid') {
            throw new Error('Only wizkids can update their own information');
        }

        let updateData = req.body;

		// Only allow updates to Name, Email, and ProfilePicture
		let safeUpdateData = {};
		if (updateData.Name) safeUpdateData.Name = updateData.Name;
		if (updateData.Pass) safeUpdateData.Pass = updateData.Pass;
		if (updateData.Email) safeUpdateData.Email = updateData.Email;
		if (updateData.ProfilePicture) safeUpdateData.ProfilePicture = updateData.ProfilePicture;

		let result = await db_wiz.updateOne(
			{ User: req.headers['user'] },
			{ $set: { ...safeUpdateData, updatedAt: new Date().toISOString() } }
		);

        if (result.matchedCount === 0) {
            throw new Error('Wizkid not found');
        }

        res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 4) Admin delete wizkid (DELETE /delete_wizkid)
app.delete('/delete_wizkid', async (req, res) => {
    try {

        let authUser = await db_wiz.findOne({ User: req.headers['user'],  Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            throw new Error('Only admins can delete wizkids');
        }

        let { wizkidUser } = req.body;

        let result = await db_wiz.deleteOne({ User: wizkidUser });

        if (result.deletedCount === 0) {
            throw new Error('Wizkid not found');
        }

        res.status(200).json({ success: true, message: 'Wizkid deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 5) Admin fire wizkid (POST /fire_wizkid)
app.post('/fire_wizkid', async (req, res) => {
    try {

        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            throw new Error('Only admins can fire wizkids');
        }

        let { wizkidUser } = req.body;
		
        let result = await db_wiz.updateOne(
            { User: wizkidUser, Exit: { $exists: false } },
            { $set: { Exit: new Date().toISOString(), updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            throw new Error('Wizkid not found or already fired');
        }

        res.status(200).json({ success: true, message: 'Wizkid fired successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 6) Admin unfire wizkid (POST /unfire_wizkid)
app.post('/unfire_wizkid', async (req, res) => {
    try {

        let authUser = await db_wiz.findOne({ User: req.headers['user'], Pass: req.headers['pass'] });
        if (!authUser || authUser.Type !== 'admin') {
            throw new Error('Only admins can unfire wizkids');
        }

        let { wizkidUser } = req.body;

        let result = await db_wiz.updateOne(
            { User: wizkidUser, Exit: { $exists: true } },
            { $unset: { Exit: "" }, $set: { updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            throw new Error('Wizkid not found or not fired');
        }

        res.status(200).json({ success: true, message: 'Wizkid unfired successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


//


async function setupDefaultCollection() {
    let mongo_client;
    try {
        // Connect to MongoDB
        mongo_client = new mongodb.MongoClient(process.env.mongo_connect);
        await mongo_client.connect();
        console.log('Connected to MongoDB');

        const db = mongo_client.db('main');
        const wiz_collection = db.collection('wiz');

        // Ensure unique index on User field
        await wiz_collection.createIndex({ User: 1 }, { unique: true });

		// Placeholder Base64 for a 1x1 pixel image (to simulate ProfilePicture)
		const placeholderProfilePicture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

        // Admin user
        const admin = {
            User: 'admin',
            Pass: 'wowow', // TODO: Hash with bcrypt in production
            Name: 'Admin User',
            Type: 'admin',
            Role: 'boss',
            Email: 'admin@company.com',
            ProfilePicture: placeholderProfilePicture,
            Entry: new Date().toISOString(),
            Exit: null
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
                ProfilePicture: placeholderProfilePicture,
                Entry: new Date('2025-01-01').toISOString(),
                Exit: null
            },
            {
                User: 'wizkid2',
                Pass: 'pass456',
                Name: 'Bob Johnson',
                Type: 'wizkid',
                Role: 'designer',
                Email: 'bob.johnson@company.com',
                ProfilePicture: placeholderProfilePicture,
                Entry: new Date('2025-02-01').toISOString(),
                Exit: null
            },
            {
                User: 'wizkid3',
                Pass: 'pass789',
                Name: 'Charlie Brown',
                Type: 'wizkid',
                Role: 'intern',
                Email: 'charlie.brown@company.com',
                ProfilePicture: placeholderProfilePicture,
                Entry: new Date('2025-03-01').toISOString(),
                Exit: new Date('2025-04-01').toISOString() // Example of a fired wizkid
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
    } finally {
        // Close the MongoDB connection
        if (mongo_client) {
            await mongo_client.close();
            console.log('MongoDB connection closed');
        }
    }
}

//setupDefaultCollection()


//

app.listen(3000, () => {
    console.log(`Server running on port ${3000}`);
});