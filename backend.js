function sleep(seconds) { return new Promise(resolve => setTimeout(resolve, seconds * 1000)) }

//

const BASE_URL = 'https://run-fox-run-q28ow.ondigitalocean.app/'

//



//

async function sendRequest(method, endpoint, headers = {}, body = null) {

    let result = null
    let xhr = new XMLHttpRequest()
    xhr.open(method, `${BASE_URL}${endpoint}`, true)
    xhr.withCredentials = true

    Object.entries(headers).forEach(([key, value]) => { xhr.setRequestHeader(key, value) })

    if (body) { xhr.setRequestHeader('Content-Type', 'application/json') }

    xhr.onload = () => {
        try {
            result = JSON.parse(xhr.responseText)
        } catch (error) {
            result = { error: 'Failed to parse response', raw: xhr.responseText }
        }
    }

    xhr.onerror = () => {
        result = { error: 'Request failed', status: xhr.status };
    }

    xhr.send(body ? JSON.stringify(body) : null)

    while (result === null) { await sleep(0.1) }

    return result
}

//

// 1) Test GET /view_wizkids
async function testViewWizkids(user='', pass='') {
    const headers = {};
    if (user !== 'guest') {
        headers['user'] = user;
        headers['pass'] = pass;
    }
    return await sendRequest('GET', '/view_wizkids', headers);
}

// 2) Test PUT /update_wizkid (admin only)
async function testUpdateWizkid(wizkidUser, updateData) {
    const headers = {
        'user': ADMIN_USER,
        'pass': ADMIN_PASS
    };
    const body = {
        wizkidUser,
        ...updateData
    };
    return await sendRequest('PUT', '/update_wizkid', headers, body);
}

// 3) Test PUT /update_own_info (wizkid only)
async function testUpdateOwnInfo(updateData) {
    const headers = {
        'user': WIZKID_USER,
        'pass': WIZKID_PASS
    };
    return await sendRequest('PUT', '/update_own_info', headers, updateData);
}

// 4) Test DELETE /delete_wizkid (admin only)
async function testDeleteWizkid(wizkidUser) {
    const headers = {
        'user': ADMIN_USER,
        'pass': ADMIN_PASS
    };
    const body = {
        wizkidUser
    };
    return await sendRequest('DELETE', '/delete_wizkid', headers, body);
}

// 5) Test POST /fire_wizkid (admin only)
async function testFireWizkid(wizkidUser) {
    const headers = {
        'user': ADMIN_USER,
        'pass': ADMIN_PASS
    };
    const body = {
        wizkidUser
    };
    return await sendRequest('POST', '/fire_wizkid', headers, body);
}

// 6) Test POST /unfire_wizkid (admin only)
async function testUnfireWizkid(wizkidUser) {
    const headers = {
        'user': ADMIN_USER,
        'pass': ADMIN_PASS
    };
    const body = {
        wizkidUser
    };
    return await sendRequest('POST', '/unfire_wizkid', headers, body);
}

// Example usage (can be called in a browser console or Node.js environment with XMLHttpRequest)
async function runTests() {
    console.log('Running tests...');

    // Test 1: View wizkids as guest
    console.log('Test 1: View wizkids as guest');
    console.log(await testViewWizkids());

    // Test 2: View wizkids as admin
    console.log('Test 2: View wizkids as admin');
    console.log(await testViewWizkids(ADMIN_USER, ADMIN_PASS));

    // Test 3: View wizkids as wizkid
    console.log('Test 3: View wizkids as wizkid');
    console.log(await testViewWizkids(WIZKID_USER, WIZKID_PASS));

    // Test 4: Update wizkid info (admin)
    console.log('Test 4: Update wizkid info');
    console.log(await testUpdateWizkid(WIZKID_USER, {
        Name: 'Updated Wizkid Name',
        Email: 'updated.wizkid@example.com'
    }));

    // Test 5: Update own info (wizkid)
    console.log('Test 5: Update own info');
    console.log(await testUpdateOwnInfo({
        Name: 'Wizkid Self Update',
        Email: 'self.update@example.com'
    }));

    // Test 6: Fire wizkid (admin)
    console.log('Test 6: Fire wizkid');
    console.log(await testFireWizkid(WIZKID_USER));

    // Test 7: Unfire wizkid (admin)
    console.log('Test 7: Unfire wizkid');
    console.log(await testUnfireWizkid(WIZKID_USER));

    // Test 8: Delete wizkid (admin)
    console.log('Test 8: Delete wizkid');
    console.log(await testDeleteWizkid(WIZKID_USER));

    console.log('Tests completed.');
}

// Run tests (uncomment to execute)
// runTests();