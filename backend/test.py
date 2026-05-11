import urllib.request
import json

data = json.dumps({"username":"superadmin", "password":"password123"}).encode('utf-8')
req = urllib.request.Request("http://localhost:8080/api/auth/login", data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as f:
        resp = json.loads(f.read().decode('utf-8'))
        token = resp['token']
        print("Logged in, token:", token[:10])
        
        req2 = urllib.request.Request("http://localhost:8080/api/branches", headers={'Authorization': 'Bearer ' + token, 'Origin': 'http://localhost:3000'})
        with urllib.request.urlopen(req2) as f2:
            print("Status:", f2.getcode())
            print(f2.read().decode('utf-8')[:100])
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode('utf-8')[:500])
