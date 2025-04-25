// Utility function to sleep for a specified time (in seconds)
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// Base URL for the API (no trailing slash)
const BASE_URL = 'https://run-fox-run-q28ow.ondigitalocean.app';

// Generic function to send an XMLHttpRequest and return the parsed response
async function request_helper(method, endpoint, headers = {}, body = null) {
    let result = null;
    let xhr = new XMLHttpRequest();
    xhr.open(method, `${BASE_URL}/${endpoint}`, true);
    xhr.withCredentials = true;

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
    });

    // Set Content-Type for POST/PUT/DELETE requests
    if (body) {
        xhr.setRequestHeader('Content-Type', 'application/json');
    }

    xhr.onload = () => {
        try {
            result = JSON.parse(xhr.responseText);
        } catch (error) {
            result = { error: 'Failed to parse response', raw: xhr.responseText };
        }
    };

    xhr.onerror = () => {
        result = { error: 'Request failed', status: xhr.status };
    };

    // Send request
    xhr.send(body ? JSON.stringify(body) : null);

    // Wait for response
    while (result === null) {
        await sleep(0.1);
    }

    return result;
}

// User credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'wowow';

const USER1 = 'wizkid1';
const PASS1 = 'pass123';

const USER2 = 'wizkid2';
const PASS2 = 'pass123';

const USER3 = 'wizkid3';
const PASS3 = 'pass123';

const USER4 = 'wizkid4';
const PASS4 = 'pass123';

const USER5 = 'wizkid5';
const PASS5 = 'pass123';

const USER6 = 'wizkid6';
const PASS6 = 'pass123';

// 1) GET /view_wizkids
async function ViewWizkids(user = '', pass = '') {
    return await request_helper('GET', 'view_wizkids', { user, pass });
}

// 2) PUT /update_wizkid (admin only)
async function UpdateWizkid(user = ADMIN_USER, pass = ADMIN_PASS, wizkidUser = USER1, updateData = { Email: 'changed@gmail.com' }) {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser, ...updateData };
    return await request_helper('PUT', 'update_wizkid', headers, body);
}

// 3) PUT /update_own_info (wizkid only)
async function UpdateOwnInfo(user = USER2, pass = PASS2, updateData = { Name: 'CallMeWhite' }) {
    const headers = { 'user': user, 'pass': pass };
    return await request_helper('PUT', 'update_own_info', headers, updateData);
}

// 4) DELETE /delete_wizkid (admin only)
async function DeleteWizkid(user = ADMIN_USER, pass = ADMIN_PASS, wizkidUser = USER3) {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser };
    return await request_helper('DELETE', 'delete_wizkid', headers, body);
}

// 5) POST /fire_wizkid (admin only)
async function FireWizkid(user = ADMIN_USER, pass = ADMIN_PASS, wizkidUser = USER3) {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser };
    return await request_helper('POST', 'fire_wizkid', headers, body);
}

// 6) POST /unfire_wizkid (admin only)
async function UnfireWizkid(user = ADMIN_USER, pass = ADMIN_PASS, wizkidUser = USER3) {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser };
    return await request_helper('POST', 'unfire_wizkid', headers, body);
}

// 7) POST /search_wizkids (guest, wizkid, admin)
async function SearchWizkids(user = '', pass = '', query = 'developer') {
    const headers = { 'user': user, 'pass': pass };
    const body = { query };
    return await request_helper('POST', 'search_wizkids', headers, body);
}

// 8) POST /create_wizkid (admin only)
async function CreateWizkid(user = ADMIN_USER, pass = ADMIN_PASS, wizkidData = {
    User: 'wizkid7',
    Pass: 'pass123',
    Name: 'Grace Kim',
    Type: 'wizkid',
    Role: 'developer',
    Email: 'grace.kim@company.com',
    ProfilePicture: '',
    Description: 'Grace is a junior developer with expertise in React and TypeScript.'
}) {
    const headers = { 'user': user, 'pass': pass };
    return await request_helper('POST', 'create_wizkid', headers, wizkidData);
}

// Example usage (for testing in browser console or Node.js)
async function runTests() {
    console.log('Running tests...');

    // Test 1: View wizkids as guest
    console.log('ViewWizkids (Guest):', await ViewWizkids());

    // Test 2: View wizkids as wizkid
    console.log('ViewWizkids (Wizkid):', await ViewWizkids(USER1, PASS1));

    // Test 3: View wizkids as admin
    console.log('ViewWizkids (Admin):', await ViewWizkids(ADMIN_USER, ADMIN_PASS));

    // Test 4: Update wizkid (admin)
    console.log('UpdateWizkid:', await UpdateWizkid(ADMIN_USER, ADMIN_PASS, USER1, {
        Email: 'updated.wizkid1@example.com',
        Description: 'Updated description for Alice, a skilled full-stack developer.'
    }));

    // Test 5: Update own info (wizkid)
    console.log('UpdateOwnInfo:', await UpdateOwnInfo(USER2, PASS2, {
        Name: 'Bob Updated',
        Description: 'Updated description for Bob, a creative UI/UX designer.'
    }));

    // Test 6: Fire wizkid (admin)
    console.log('FireWizkid:', await FireWizkid(ADMIN_USER, ADMIN_PASS, USER3));

    // Test 7: Unfire wizkid (admin)
    console.log('UnfireWizkid:', await UnfireWizkid(ADMIN_USER, ADMIN_PASS, USER3));

    // Test 8: Delete wizkid (admin)
    console.log('DeleteWizkid:', await DeleteWizkid(ADMIN_USER, ADMIN_PASS, USER3));

    // Test 9: Search wizkids as guest
    console.log('SearchWizkids (Guest):', await SearchWizkids('', '', 'machine learning'));

    // Test 10: Search wizkids as admin
    console.log('SearchWizkids (Admin):', await SearchWizkids(ADMIN_USER, ADMIN_PASS, 'UI/UX'));

    // Test 11: Create wizkid (admin)
    console.log('CreateWizkid:', await CreateWizkid(ADMIN_USER, ADMIN_PASS, {
        User: 'wizkid7',
        Pass: 'pass123',
        Name: 'Grace Kim',
        Type: 'wizkid',
        Role: 'developer',
        Email: 'grace.kim@company.com',
        ProfilePicture: '',
        Description: 'Grace is a junior developer with expertise in React and TypeScript.'
    }));

    console.log('Tests completed.');
}

// Run tests (uncomment to execute)
// runTests();