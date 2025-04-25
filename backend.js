function sleep(seconds) { return new Promise(resolve => setTimeout(resolve, seconds * 1000)) }
//

const BASE_URL = 'https://run-fox-run-q28ow.ondigitalocean.app'

async function request_helper(method, endpoint, headers={}, body=null) {
    let result = null
    let xhr = new XMLHttpRequest()
    xhr.open(method, `${BASE_URL}/${endpoint}`, true)
    xhr.withCredentials = true
    Object.entries(headers).forEach(([key, value]) => { xhr.setRequestHeader(key, value) })
    if (body) { xhr.setRequestHeader('Content-Type', 'application/json') }
    xhr.onload = () => {
        try { result = JSON.parse(xhr.responseText) }
		catch (error) { result = { error: 'Failed to parse response', raw: xhr.responseText } }
    }
    xhr.onerror = () => {
        result = { error: 'Request failed', status: xhr.status };
    }
    xhr.send(body ? JSON.stringify(body) : null)
    while (result === null) { await sleep(0.1) }
    return result
}

//


const ADMIN_USER = 'admin'
const ADMIN_PASS = 'wowow'

const USER1 = 'wizkid1'
const PASS1 = 'pass123'

const USER2 = 'wizkid2'
const PASS2 = 'pass456'


// 1)  GET /view_wizkids

async function ViewWizkids(user='', pass='') {
    return await request_helper('GET', 'view_wizkids', {user, pass});
}

// 2)  PUT /update_wizkid (admin only)

async function UpdateWizkid(user=ADMIN_USER, pass=ADMIN_PASS, wizkidUser=USER1, updateData={'email':'changed@gmail.com'}) {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser, ...updateData };
    return await request_helper('PUT', 'update_wizkid', headers, body);
}

// 3)  PUT /update_own_info (wizkid only)

async function UpdateOwnInfo(user=USER2, pass=PASS2, updateData={'name':'CallMeWhite'}) {
    const headers = {'user': user, 'pass': pass };
    return await request_helper('PUT', 'update_own_info', headers, updateData);
}

// 4)  DELETE /delete_wizkid (admin only)

async function DeleteWizkid(user=ADMIN_USER, pass=ADMIN_PASS, wizkidUser='wizkid3') {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser };
    return await request_helper('DELETE', 'delete_wizkid', headers, body);
}

// 5)  POST /fire_wizkid (admin only)

async function FireWizkid(user=ADMIN_USER, pass=ADMIN_PASS, wizkidUser='wizkid3') {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser };
    return await request_helper('POST', 'fire_wizkid', headers, body);
}

// 6)  POST /unfire_wizkid (admin only)

async function UnfireWizkid(user=ADMIN_USER, pass=ADMIN_PASS, wizkidUser='wizkid3') {
    const headers = { 'user': user, 'pass': pass };
    const body = { wizkidUser };
    return await request_helper('POST', 'unfire_wizkid', headers, body);
}

