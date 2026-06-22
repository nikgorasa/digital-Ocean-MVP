# TBO API Integration — Error Documentation

**Agency:** RASA Travel Services India Private Limited  
**Agency ID:** RasaT  
**Date:** 2026-06-19  
**Prepared for:** TBO Support Team (Sadhna Kumari)

---

## Issue Summary

The production endpoint `affiliate.tektravels.com` rejects our agency credentials with **"Access Credentials is incorrect"** even though authentication succeeds. The staging endpoint `api.tbotechnology.in` works correctly with the same credentials.

---

## Test 1: Authentication — SUCCESS

**Request:**
```http
POST http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate
Content-Type: application/json

{
  "ClientId": "ApiIntegrationNew",
  "UserName": "RasaT",
  "Password": "RasaT@123",
  "EndUserIp": "192.168.1.1"
}
```

**Response:**
```json
{
  "Status": 1,
  "TokenId": "8fda7737-f016-4939-bfcd-a5260ccac532",
  "Error": { "ErrorCode": 0, "ErrorMessage": "" }
}
```

**Result:** Authentication succeeds. Token is issued.

---

## Test 2: Hotel Search on Production Endpoint — FAILS

**Request:**
```http
POST https://affiliate.tektravels.com/HotelAPI/Search
Content-Type: application/json

{
  "CheckIn": "2026-06-25",
  "CheckOut": "2026-06-27",
  "HotelCodes": "1011648",
  "GuestNationality": "IN",
  "PaxRooms": [{"Adults": 1, "Children": 0, "ChildrenAges": []}],
  "PreferredCurrency": "INR",
  "EndUserIp": "192.168.1.1",
  "TokenId": "8fda7737-f016-4939-bfcd-a5260ccac532"
}
```

**Response:**
```json
{
  "Status": {
    "Code": 401,
    "Description": "Access Credentials is incorrect"
  }
}
```

**HTTP Status:** 200  
**Response Time:** 1.3s  

**Result:** FAILS — 401 "Access Credentials is incorrect" despite valid token from authentication.

---

## Test 3: Hotel Search on Staging/Test Endpoint — SUCCESS

**Request:**
```http
POST http://api.tbotechnology.in/TBOHolidays_HotelAPI/Search
Content-Type: application/json
Authorization: Basic TBOStaticAPITest:Tbo@11530818

{
  "CheckIn": "2026-06-25",
  "CheckOut": "2026-06-27",
  "HotelCodes": "1011648",
  "GuestNationality": "IN",
  "PaxRooms": [{"Adults": 1, "Children": 0, "ChildrenAges": []}],
  "PreferredCurrency": "INR"
}
```

**Response:**
```json
{
  "Status": { "Code": 200, "Description": "Successful" },
  "HotelResult": [{
    "HotelCode": "1011648",
    "Currency": "USD",
    "Rooms": [{
      "Name": ["Deluxe Room,2 Twin Beds"],
      "BookingCode": "1011648!TB!1!TB!cf7079c8-6c19-11f1-a2cd-1a9e5baa8fab!TB!N!TB!AFF!",
      "TotalFare": 184.9,
      "TotalTax": 23.43,
      "MealType": "BreakFast",
      "IsRefundable": true
    }]
  }]
}
```

**Result:** SUCCESS — 200 with real hotel data, booking codes, and pricing.

---

## Comparison

| Test | Endpoint | Auth Method | Result |
|------|----------|-------------|--------|
| Authentication | `Sharedapi.tektravels.com` | Body params | ✅ Token issued |
| Hotel Search (Production) | `affiliate.tektravels.com/HotelAPI/Search` | TokenId in body | ❌ 401 Access Credentials is incorrect |
| Hotel Search (Staging) | `api.tbotechnology.in/TBOHolidays_HotelAPI/Search` | Basic Auth header | ✅ 200 Successful |

---

## Conclusion

1. The agency credentials (`RasaT` / `RasaT@123`) are **valid** — authentication succeeds and returns a token
2. The production endpoint (`affiliate.tektravels.com`) **rejects** these credentials for search
3. The staging/test endpoint (`api.tbotechnology.in`) **accepts** these credentials and returns real data

This indicates the agency account is **not yet provisioned/certified** for the production API endpoint. Please advise on the certification process required to access `affiliate.tektravels.com/HotelAPI/Search`.

---

## TBO API Documentation Reference

- Hotel API Docs: https://apidoc.tektravels.com/hotelnew/Default.aspx
- Hotel API Guide: https://apidoc.tektravels.com/hotelnew/apiguide.aspx
- Search Endpoint (per docs): `https://affiliate.tektravels.com/HotelAPI/Search`
- Certification: https://apidoc.tektravels.com/hotelnew/Certification.aspx
