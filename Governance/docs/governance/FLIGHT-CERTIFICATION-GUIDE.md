# TBO Flight API Certification Guide

**Version:** 1.0.0
**Date:** 2026-07-26
**Status:** Research Complete — Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [TBO Flight vs Hotel Certification Differences](#certification-differences)
3. [Certification Process — Step by Step](#certification-process)
4. [Flight Booking Workflow (End-to-End)](#booking-workflow)
5. [API Endpoints — Request & Response Formats](#api-endpoints)
6. [Certification Test Cases](#test-cases)
7. [GDS-AMADEUS Fare Integration](#amadeus-integration)
8. [What to Capture in Logs for Certification](#log-capture)
9. [UI Certification Requirements (Display Rules)](#ui-requirements)
10. [Current Implementation Gaps](#implementation-gaps)
11. [References](#references)

---

## 1. Overview

TBO (Travel Boutique Online / Tek Travels) requires **mandatory certification** before granting live API access for flight bookings. Unlike hotel certification (which has a documented 8-case test matrix), flight certification is less publicly documented but follows the same pattern:

1. **Workflow submission** — Document your API call flow
2. **Sample verification** — Submit request/response logs for test bookings
3. **UI verification** — Provide screenshots of your booking pages
4. **TBO review** — TBO tech team validates your integration
5. **Live credentials** — Upon approval, receive production access

### Key Difference from Hotel Certification

| Aspect | Hotel Certification | Flight Certification |
|---|---|---|
| **Documentation** | Well-documented (8 cases on api.tbotechnology.in) | Less publicly documented; process described on api.tektravels.com |
| **Test cases** | Fixed 8 room configurations | Flexible: domestic/international, LCC/FSC, one-way/round-trip/multi-city |
| **Endpoints** | HotelSearch → HotelBook → HotelBookingDetail | Authenticate → Search → FareQuote → Book → Ticket |
| **GDS involvement** | No GDS (direct hotel suppliers) | GDS-backed (Amadeus/Sabre content through TBO consolidator) |
| **PNR** | Hotel confirmation number | Airline PNR ( Passenger Name Record) |
| **Ticketing** | Voucher generation | E-ticket issuance (LCC vs Non-LCC different flows) |
| **UI display rules** | Hotel-specific (star rating, images, amenities) | Airline-specific (fare breakdown, baggage, flight warnings, layover info) |

---

## 2. Certification Process — Step by Step

### Step 1: Partner Registration

1. Register at [tbo.com](https://www.tbo.com) or through TBO's partner program
2. Submit travel agency registration, IATA/non-IATA status, and basic KYC
3. TBO activates test credentials within 3–7 days
4. **Client ID must be `ApiIntegrationNew`** in authentication requests (for test)

### Step 2: Obtain Test Credentials

| Credential | Test Value |
|---|---|
| `ClientId` | `ApiIntegrationNew` |
| `UserName` | (provided by TBO) |
| `Password` | (provided by TBO) |
| Auth URL | `http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate` |
| API Base URL | `http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest` |

### Step 3: Implement API Workflow

Implement the complete flight booking flow (see [Section 4](#booking-workflow)).

### Step 4: Execute Certification Test Cases

Run the required test cases (see [Section 6](#test-cases)) and capture:
- Full request JSON for each API call
- Full response JSON for each API call
- Screenshots of your UI at each step

### Step 5: Submit Certification Package

Submit to TBO tech team:
1. **Workflow diagram** — showing your API call sequence
2. **Request/Response logs** — for each test case (redact API keys)
3. **UI screenshots** — search results page, booking page, confirmation page
4. **Test case matrix** — which scenarios you tested and results

### Step 6: TBO Review & Feedback

- TBO reviews your submission (typically 1–2 weeks)
- They may request corrections or additional test cases
- Common issues: price display accuracy, missing baggage info, incorrect PNR handling

### Step 7: Live Credentials

Upon certification approval:
- TBO provides production credentials
- Production endpoints may differ from test
- IP whitelisting may be required

---

## 3. Flight Booking Workflow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TBO FLIGHT BOOKING FLOW                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Authenticate                                                    │
│     POST /SharedData.svc/rest/Authenticate                         │
│     → Returns TokenId (valid for the day)                          │
│                                                                     │
│  2. Search Flights                                                  │
│     POST /AirService.svc/rest/Search                               │
│     → Returns flight results with ResultIndex                      │
│                                                                     │
│  3. Get Fare Rules (optional but recommended)                      │
│     POST /AirService.svc/rest/FareRule                             │
│     → Returns fare restriction details                             │
│                                                                     │
│  4. Get Fare Quote (MANDATORY before booking)                      │
│     POST /AirService.svc/rest/FareQuote                            │
│     → Re-validates price, confirms availability                    │
│     → Returns IsPriceChanged flag                                  │
│                                                                     │
│  5. Get SSR (for LCC flights — meals, baggage, seats)             │
│     POST /AirService.svc/rest/SSR                                  │
│     → Returns ancillary service options                            │
│                                                                     │
│  6. Book Flight                                                     │
│     POST /AirService.svc/rest/Book                                 │
│     → Creates PNR, returns BookingId + PNR                        │
│                                                                     │
│  7. Ticket Flight                                                   │
│     POST /AirService.svc/rest/Ticket                               │
│     → Issues e-ticket (different flow for LCC vs Non-LCC)         │
│                                                                     │
│  8. Get Booking Details (post-booking verification)                │
│     POST /AirService.svc/rest/GetBookingDetail                     │
│     → Retrieves full itinerary and ticket status                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Critical Rules

1. **NEVER skip FareQuote** — Search prices are indicative. FareQuote re-validates the price before booking.
2. **Token is daily** — Cache the TokenId for the day, re-authenticate the next day.
3. **LCC vs Non-LCC ticketing** — Different request formats for ticketing.
4. **EndUserIp** must be passed in every request — TBO uses this for session tracking.

---

## 4. API Endpoints — Request & Response Formats

### 4.1 Authenticate

**URL:** `POST http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate`

**Request:**
```json
{
  "ClientId": "ApiIntegrationNew",
  "UserName": "your_username",
  "Password": "your_password",
  "EndUserIp": "192.168.1.1"
}
```

**Response:**
```json
{
  "Status": 1,
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "Error": null,
  "Member": null
}
```

**Notes:**
- `Status: 1` = success
- `TokenId` must be included in all subsequent requests
- Token is valid for the calendar day (re-authenticate daily)

---

### 4.2 Search

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/Search`

**Request — One Way (JourneyType: 1):**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "AdultCount": 1,
  "ChildCount": 0,
  "InfantCount": 0,
  "JourneyType": 1,
  "Segments": [
    {
      "Origin": "DEL",
      "Destination": "BOM",
      "FlightCabinClass": 1,
      "PreferredDepartureTime": "2026-08-15",
      "PreferredArrivalTime": ""
    }
  ]
}
```

**Request — Round Trip (JourneyType: 2):**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "AdultCount": 1,
  "ChildCount": 0,
  "InfantCount": 0,
  "JourneyType": 2,
  "Segments": [
    {
      "Origin": "DEL",
      "Destination": "BOM",
      "FlightCabinClass": 1,
      "PreferredDepartureTime": "2026-08-15",
      "PreferredArrivalTime": ""
    },
    {
      "Origin": "BOM",
      "Destination": "DEL",
      "FlightCabinClass": 1,
      "PreferredDepartureTime": "2026-08-20",
      "PreferredArrivalTime": ""
    }
  ]
}
```

**Request — Multi-City (JourneyType: 3):**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "AdultCount": 1,
  "ChildCount": 0,
  "InfantCount": 0,
  "JourneyType": 3,
  "Segments": [
    {
      "Origin": "DEL",
      "Destination": "BOM",
      "FlightCabinClass": 1,
      "PreferredDepartureTime": "2026-08-15",
      "PreferredArrivalTime": ""
    },
    {
      "Origin": "BOM",
      "Destination": "GOI",
      "FlightCabinClass": 1,
      "PreferredDepartureTime": "2026-08-18",
      "PreferredArrivalTime": ""
    },
    {
      "Origin": "GOI",
      "Destination": "DEL",
      "FlightCabinClass": 1,
      "PreferredDepartureTime": "2026-08-22",
      "PreferredArrivalTime": ""
    }
  ]
}
```

**JourneyType Values:**
| Value | Meaning |
|---|---|
| 1 | One Way |
| 2 | Return (Round Trip) |
| 3 | Multi-City |
| 5 | Special Return |

**FlightCabinClass Values:**
| Value | Class |
|---|---|
| 0 | All |
| 1 | Economy |
| 2 | Premium Economy |
| 3 | Business |
| 4 | Premium Business |
| 5 | First |

**Response (simplified):**
```json
{
  "Response": {
    "ResponseStatus": 1,
    "Error": null,
    "TraceId": "uuid-trace-id",
    "Results": [
      [
        {
          "ResultIndex": "OB1",
          "Source": 1,
          "IsLCC": false,
          "IsRefundable": true,
          "Fare": {
            "Currency": "INR",
            "BaseFare": 4500,
            "Tax": 1200,
            "YQTax": 500,
            "PublishedFare": 6200,
            "OfferedFare": 5900,
            "CommissionEarned": 300,
            "OtherCharges": 0,
            "Discount": 0,
            "ServiceFee": 0
          },
          "FareBreakdown": [...],
          "Segments": [
            [
              {
                "TripIndicator": 1,
                "SegmentIndicator": 1,
                "Airline": {
                  "AirlineCode": "AI",
                  "AirlineName": "Air India",
                  "FlightNumber": "9843",
                  "FareClass": "Y",
                  "OperatingCarrier": "AI"
                },
                "Origin": {
                  "Airport": {
                    "AirportCode": "DEL",
                    "AirportName": "Indira Gandhi Airport",
                    "Terminal": "3",
                    "CityCode": "DEL",
                    "CityName": "Delhi",
                    "CountryCode": "IN",
                    "CountryName": "India"
                  },
                  "DepTime": "2026-08-15T07:15:00"
                },
                "Destination": {
                  "Airport": {
                    "AirportCode": "BOM",
                    "AirportName": "Chhatrapati Shivaji International Airport",
                    "Terminal": "2",
                    "CityCode": "BOM",
                    "CityName": "Mumbai",
                    "CountryCode": "IN",
                    "CountryName": "India"
                  },
                  "ArrTime": "2026-08-15T09:30:00"
                },
                "Duration": 135,
                "Baggage": "25 KG",
                "CabinBaggage": "7 KG",
                "CabinClass": 1,
                "NoOfSeatAvailable": 9,
                "StopOver": false,
                "IsETicketEligible": true,
                "FlightStatus": "Confirmed",
                "Status": "HK"
              }
            ]
          ],
          "LastTicketDate": "2026-08-15T23:59:00",
          "Penalty": "",
          "FareRules": "...",
          "AirlineRemark": "",
          "FareInclusions": ["Meal:Included", "Seat:Excluded"],
          "ValidatingAirline": "AI"
        }
      ]
    ]
  }
}
```

---

### 4.3 FareRule

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/FareRule`

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "TraceId": "uuid-from-search",
  "ResultIndex": "OB1"
}
```

**Response:**
```json
{
  "Response": {
    "ResponseStatus": 1,
    "Error": null,
    "TraceId": "uuid",
    "FareRules": [
      {
        "Airline": "AI",
        "Origin": "DEL",
        "Destination": "BOM",
        "FareBasisCode": "Y",
        "FareRestriction": "Y",
        "FareRuleDetail": "NON-REFUNDABLE FARE..."
      }
    ]
  }
}
```

---

### 4.4 FareQuote (Re-validation — MANDATORY before Book)

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/FareQuote`

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "TraceId": "uuid-from-search",
  "ResultIndex": "OB1"
}
```

**Response:**
```json
{
  "Response": {
    "ResponseStatus": 1,
    "Error": null,
    "TraceId": "uuid",
    "IsPriceChanged": false,
    "Results": {
      "ResultIndex": "OB1",
      "IsLCC": false,
      "Fare": {
        "Currency": "INR",
        "BaseFare": 4500,
        "Tax": 1200,
        "PublishedFare": 6200,
        "OfferedFare": 5900
      },
      "Segments": [...],
      "FareRules": [...]
    }
  }
}
```

**Critical:**
- If `IsPriceChanged: true`, you MUST inform the user before proceeding
- The FareQuote response contains the validated price — use this for booking, NOT the search price
- This step is mandatory for certification

---

### 4.5 SSR (Special Service Requests)

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/SSR`

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "TraceId": "uuid-from-search",
  "ResultIndex": "OB1"
}
```

**Response:**
```json
{
  "Response": {
    "ResponseStatus": 1,
    "Error": null,
    "TraceId": "uuid",
    "IsLCC": false,
    "Baggage": [
      [
        { "WayType": 1, "Code": "NoBaggage", "Weight": "0 KG", "Currency": "INR", "Price": 0, "Origin": "DEL", "Destination": "BOM", "AirlineCode": "AI", "FlightNumber": "9843" },
        { "WayType": 1, "Code": "15K", "Weight": "15 KG", "Currency": "INR", "Price": 750, "Origin": "DEL", "Destination": "BOM", "AirlineCode": "AI", "FlightNumber": "9843" }
      ]
    ],
    "MealDynamic": [
      [
        { "WayType": 1, "Code": "AVML", "Description": "Veg Indian Meal", "Quantity": 1, "Price": 350, "Currency": "INR" },
        { "WayType": 1, "Code": "NoMeal", "Description": "No Meal", "Quantity": 0, "Price": 0, "Currency": "INR" }
      ]
    ],
    "SeatDynamic": [...]
  }
}
```

**Notes:**
- SSR is required for LCC flights (IndiGo, SpiceJet, AirAsia, etc.)
- For Non-LCC, SSR is optional but recommended
- Baggage/meal/seat selections are passed in the Book request for LCC

---

### 4.6 Book

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/Book`

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "TraceId": "uuid-from-search",
  "ResultIndex": "OB1",
  "Passengers": [
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "PaxType": 1,
      "DateOfBirth": "1990-05-15",
      "Gender": 1,
      "AddressLine1": "123 Main Street",
      "City": "Delhi",
      "CountryCode": "IN",
      "CountryName": "India",
      "ContactNo": "9876543210",
      "Email": "john.doe@example.com",
      "IsLeadPax": true,
      "Nationality": "IN",
      "Fare": {
        "BaseFare": 4500,
        "Tax": 1200,
        "TransactionFee": 0,
        "YQTax": 500,
        "AdditionalTxnFeeOfrd": 0,
        "AdditionalTxnFeePub": 0,
        "AirTransFee": 0
      },
      "PassportNo": "",
      "PassportExpiry": "",
      "GSTNumber": "",
      "GSTCompanyName": ""
    }
  ]
}
```

**Passenger Type Codes:**
| Value | Type |
|---|---|
| 1 | Adult |
| 2 | Child |
| 3 | Infant |

**Gender Codes:**
| Value | Gender |
|---|---|
| 1 | Male |
| 2 | Female |

**Response:**
```json
{
  "ResponseStatus": 1,
  "Response": {
    "ResponseStatus": 1,
    "Error": null,
    "TraceId": "uuid",
    "IsPriceChanged": false,
    "IsTimeChanged": false,
    "FlightItinerary": {
      "BookingId": "12345",
      "PNR": "ABC123",
      "IsLCC": false,
      "IsDomestic": true,
      "Passenger": [
        {
          "PaxId": 1,
          "Title": "Mr",
          "FirstName": "John",
          "LastName": "Doe",
          "Ticket": null
        }
      ]
    }
  }
}
```

**Critical Notes:**
- `ResponseStatus` can be at TOP level OR inside `Response` — handle both
- `FlightItinerary` may be nested at different levels — check multiple paths
- Store `BookingId` and `PNR` for subsequent Ticket call
- If `IsPriceChanged: true` or `IsTimeChanged: true`, inform user before proceeding

---

### 4.7 Ticket

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/Ticket`

#### For Non-LCC Flights (Full-Service Carriers):

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "TraceId": "uuid-from-search",
  "PNR": "ABC123",
  "BookingId": "12345",
  "Passport": [
    {
      "PaxId": 1,
      "PassportNo": "AB1234567",
      "PassportExpiry": "2030-12-31",
      "DateOfBirth": "1990-05-15"
    }
  ]
}
```

#### For LCC Flights (Low-Cost Carriers):

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "TraceId": "uuid-from-search",
  "ResultIndex": "OB1",
  "Passengers": [
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "PaxType": 1,
      "DateOfBirth": "1990-05-15",
      "Gender": 1,
      "AddressLine1": "123 Main Street",
      "City": "Delhi",
      "CountryCode": "IN",
      "CountryName": "India",
      "ContactNo": "9876543210",
      "Email": "john.doe@example.com",
      "IsLeadPax": true,
      "Nationality": "IN",
      "Fare": { "BaseFare": 3000, "Tax": 800, "TransactionFee": 0, "YQTax": 200, "AdditionalTxnFeeOfrd": 0, "AdditionalTxnFeePub": 0, "AirTransFee": 0 },
      "Baggage": [{ "WayType": 1, "Code": "NoBaggage", "Weight": "0 KG", "Currency": "INR", "Price": 0 }],
      "MealDynamic": [{ "WayType": 1, "Code": "NoMeal", "Description": "No Meal", "Quantity": 0, "Price": 0, "Currency": "INR" }]
    }
  ]
}
```

**Response:**
```json
{
  "Response": {
    "ResponseStatus": 1,
    "Error": null,
    "TraceId": "uuid",
    "Response": {
      "PNR": "ABC123",
      "BookingId": "12345",
      "IsPriceChanged": false,
      "FlightItinerary": {
        "BookingId": "12345",
        "PNR": "ABC123",
        "IsLCC": false,
        "IsDomestic": true,
        "Passenger": [
          {
            "PaxId": 1,
            "Title": "Mr",
            "FirstName": "John",
            "LastName": "Doe",
            "Ticket": {
              "TicketId": 1,
              "TicketNumber": "0981234567890",
              "TicketStatus": "OK",
              "TicketType": "PTA",
              "ConjunctionNumber": "",
              "ValidOn": "AI"
            }
          }
        ],
        "Segments": [...],
        "Fare": {...},
        "FareBreakdown": [...]
      }
    }
  }
}
```

---

### 4.8 GetBookingDetail

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/GetBookingDetail`

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "BookingId": "12345"
}
```

**Alternative (search by PNR):**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "PNR": "ABC123",
  "FirstName": "John",
  "LastName": "Doe"
}
```

---

### 4.9 Cancellation APIs

#### GetCancellationCharges

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/GetCancellationCharges`

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "RequestType": 1,
  "BookingId": 12345
}
```

**Response:**
```json
{
  "Response": {
    "ResponseStatus": 1,
    "RefundAmount": 3500,
    "CancellationCharge": 2500,
    "Currency": "INR",
    "Remarks": "Cancellation charges applied per fare rules"
  }
}
```

#### SendChangeRequest (Cancel)

**URL:** `POST http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest/SendChangeRequest`

**Request:**
```json
{
  "EndUserIp": "192.168.1.1",
  "TokenId": "xxxx-xxxx-xxxx-xxxx",
  "BookingId": 12345,
  "RequestType": 1,
  "CancellationType": 3,
  "Remarks": "Customer requested cancellation"
}
```

**RequestType Values:**
| Value | Type |
|---|---|
| 1 | Full Cancellation |
| 2 | Partial Cancellation |
| 3 | Reissuance |

**CancellationType Values:**
| Value | Type |
|---|---|
| 1 | No Show |
| 2 | Flight Cancelled |
| 3 | Others |

---

## 5. Certification Test Cases

TBO flight certification requires testing across multiple scenarios. Based on industry practice and TBO's documented hotel certification pattern, the following test cases are required:

### 5.1 Domestic Flight Tests

| Test Case | Scenario | Passengers | Journey Type | Key Validation |
|---|---|---|---|---|
| **DC-01** | Domestic One-Way | 1 Adult | One Way (1) | Search → FareQuote → Book → Ticket → GetBookingDetail |
| **DC-02** | Domestic Round-Trip | 1 Adult | Return (2) | Outbound + Return segments, TripIndicator validation |
| **DC-03** | Domestic One-Way + Child | 1 Adult + 1 Child | One Way (1) | Child fare breakdown, age validation |
| **DC-04** | Domestic One-Way + Infant | 1 Adult + 1 Infant | One Way (1) | Infant on lap, infant fare (typically 10% of adult) |
| **DC-05** | Domestic Multi-City | 1 Adult | Multi-City (3) | 3+ segments, each with correct origin/destination |
| **DC-06** | Domestic LCC Flight | 1 Adult | One Way (1) | LCC-specific ticketing flow (SSR → Book → Ticket with ancillaries) |
| **DC-07** | Domestic FSC Flight | 1 Adult | One Way (1) | Full-service carrier flow (simpler ticketing) |
| **DC-08** | Domestic Multi-Pax | 2 Adults + 1 Child + 1 Infant | Return (2) | 4 passengers, mixed types, correct fare per pax |

### 5.2 International Flight Tests

| Test Case | Scenario | Passengers | Journey Type | Key Validation |
|---|---|---|---|---|
| **IC-01** | International One-Way | 1 Adult | One Way (1) | Passport required, currency conversion, international taxes |
| **IC-02** | International Round-Trip | 1 Adult | Return (2) | Return segment validation, multi-country |
| **IC-03** | International Multi-City | 1 Adult | Multi-City (3) | 3+ countries, complex routing |
| **IC-04** | International + Child | 1 Adult + 1 Child | One Way (1) | Child age validation (2–11 years), child fare |
| **IC-05** | International + Infant | 1 Adult + 1 Infant | Return (2) | Infant on lap, infant passport requirements |
| **IC-06** | International Multi-Pax | 2 Adults | Return (2) | Passport details for all passengers |

### 5.3 Special Scenario Tests

| Test Case | Scenario | Key Validation |
|---|---|---|
| **SS-01** | Price Changed Between Search and Book | FareQuote returns `IsPriceChanged: true` — UI must inform user |
| **SS-02** | Time Changed Between Search and Book | Book returns `IsTimeChanged: true` — UI must inform user |
| **SS-03** | Flight Cancellation | GetCancellationCharges → SendChangeRequest → GetChangeRequestStatus |
| **SS-04** | Partial Cancellation | Cancel one segment of a multi-segment booking |
| **SS-05** | Booking Detail Retrieval | GetBookingDetail by BookingId, by PNR, by Name |
| **SS-06** | Token Expiry | Re-authenticate after token expires |
| **SS-07** | No Results Found | Handle "No Result Found" gracefully (not an error) |
| **SS-08** | Hold Booking (if supported) | Book without immediate ticketing, ticket later |

### 5.4 Certification Submission Format

For each test case, submit:
```
[Case XX] : Description
Flow: Authenticate → Search → FareRule → FareQuote → SSR → Book → Ticket → GetBookingDetail
Request/Response logs for each step
UI screenshots for: Search Results, Fare Selection, Booking Form, Confirmation
```

---

## 6. GDS-AMADEUS Fare Integration

TBO acts as a **GDS consolidator** — it aggregates content from Amadeus, Sabre, and other GDS systems, plus direct airline connections. Here's how GDS-AMADEUS integration works within TBO:

### 6.1 Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ Your Booking  │────▶│   TBO API    │────▶│  GDS Systems     │
│ Engine        │     │  (REST/JSON) │     │  (Amadeus/Sabre) │
└──────────────┘     └──────────────┘     └──────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Direct Airline  │
                     │  Connections     │
                     │  (LCC APIs)      │
                     └──────────────────┘
```

### 6.2 How TBO Abstracts GDS Complexity

| Your Request | TBO Internally |
|---|---|
| Search(DEL→BOM) | TBO queries Amadeus + Sabre + airline APIs |
| Results returned | TBO normalizes to unified JSON format |
| FareQuote(ResultIndex) | TBO re-validates against the original GDS |
| Book(Passengers) | TBO creates PNR in the appropriate GDS |
| Ticket(BookingId) | TBO issues e-ticket through GDS/BSP |

### 6.3 Amadeus-Specific Considerations

1. **Fare Basis Codes** — Amadeus uses fare basis codes (e.g., "YR", "B3APIS") that TBO passes through. These appear in FareRules.

2. **Booking Classes** — Amadeus booking classes (Y, B, M, H, Q, V, W, etc.) map to TBO's CabinClass. TBO normalizes these but the raw booking class is in the response.

3. **Segment Stacking** — For connecting flights, Amadeus returns separate segments. TBO groups them under `Segments[0]` (outbound) and `Segments[1]` (return for round-trip).

4. **Fare Construction** — Amadeus uses NUC (Neutral Unit of Construction) for international fares. TBO converts to local currency. The conversion rate may appear in detailed fare breakdowns.

5. **PNR Format** — Amadeus PNRs are 6-character alphanumeric (e.g., "ABC123"). TBO returns this as-is.

6. **Ticket Number Format** — Amadeus e-ticket numbers are 13-digit (e.g., "098-1234567890"). TBO returns the full number.

### 6.4 LCC vs FSC Distinction

| Characteristic | LCC (Low-Cost Carrier) | FSC (Full-Service Carrier) |
|---|---|---|
| **Examples** | IndiGo, SpiceJet, AirAsia, GoFirst | Air India, Vistara, Emirates, Singapore Airlines |
| **IsLCC flag** | `true` | `false` |
| **Ticketing flow** | Complex (SSR + Book + Ticket with ancillaries) | Simple (Book + Ticket with passport only) |
| **Baggage** | Not included (must purchase via SSR) | Usually included (shown in Baggage field) |
| **Meals** | Not included (must purchase via SSR) | Often included or available for purchase |
| **Seat selection** | Paid (via SSR) | Usually free or paid for premium seats |
| **Fare class** | Single class (Economy) | Multiple classes (Economy, Business, First) |

---

## 7. UI Certification Requirements (Display Rules)

Based on the Flight API Certification Checklist (from industry documentation), your UI MUST display:

### 7.1 Search Results Page

| Requirement | Description | API Field |
|---|---|---|
| **Total price per traveler** | Displayed per passenger, NOT multiplied | `Fare.PublishedFare` or `Fare.OfferedFare` |
| **Baggage fees link** | Link to baggage info for each fare | `Segments[0][0].Baggage` |
| **Origin city/airport** | City name, airport name, airport code | `Segments[0][0].Origin.Airport.*` |
| **Destination city/airport** | City name, airport name, airport code | `Segments[last][0].Destination.Airport.*` |
| **Flight number** | For each segment | `Segments[0][0].Airline.FlightNumber` |
| **Departure date/time** | For each segment | `Segments[0][0].Origin.DepTime` |
| **Arrival date/time** | For each segment | `Segments[0][0].Destination.ArrTime` |
| **Trip duration** | Total and per slice | `Duration` (in minutes) |
| **Layover information** | Duration, airport, code for each layover | Segment `StopOver`, `GroundTime` |
| **Flight warnings** | Overnight connections, next-day arrival | `AirlineRemark`, segment info |
| **Search box on results** | Must be accessible on results page | UI component |

### 7.2 Booking Entry Page

| Requirement | Description | API Field |
|---|---|---|
| **Passenger info inputs** | First name, last name, DOB, gender for all pax | Book request `Passengers[]` |
| **Summary of charges** | Ticket price, taxes, total per ticket, grand total | `FareBreakdown[]` |
| **Fare rules link** | Link to fare rules popup | FareRule response |
| **Cancellation policy** | Display cancellation charges | PenaltyCharges from FareQuote |
| **Trip ID after booking** | Display PNR/BookingId after successful book | Book response `PNR`, `BookingId` |

### 7.3 Confirmation Page

| Requirement | Description | API Field |
|---|---|---|
| **PNR/Booking Reference** | Prominently displayed | Book response `PNR` |
| **E-ticket number** | If ticketed | Ticket response `TicketNumber` |
| **Full itinerary** | All segments with times | GetBookingDetail response |
| **Passenger list** | All passengers with ticket status | GetBookingDetail `Passenger[]` |
| **Fare breakdown** | Base fare + taxes + total | `Fare`, `FareBreakdown` |
| **Cancel button** | If cancellation allowed | `IsRefundable`, penalty info |

---

## 8. What to Capture in Logs for Certification

### 8.1 Required Logs

For each certification test case, capture and save:

```json
{
  "testCaseId": "DC-01",
  "description": "Domestic One-Way - DEL to BOM - 1 Adult",
  "timestamp": "2026-07-26T10:30:00Z",
  "steps": [
    {
      "step": 1,
      "name": "Authenticate",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 450
    },
    {
      "step": 2,
      "name": "Search",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 3200
    },
    {
      "step": 3,
      "name": "FareRule",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 800
    },
    {
      "step": 4,
      "name": "FareQuote",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 1500
    },
    {
      "step": 5,
      "name": "SSR",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 600
    },
    {
      "step": 6,
      "name": "Book",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 4500
    },
    {
      "step": 7,
      "name": "Ticket",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 5200
    },
    {
      "step": 8,
      "name": "GetBookingDetail",
      "request": { ... },
      "response": { ... },
      "httpStatus": 200,
      "responseTimeMs": 900
    }
  ]
}
```

### 8.2 What to Redact

Before submitting to TBO:
- ✅ **Redact:** `TokenId` (session token), `EndUserIp` (if private)
- ❌ **Do NOT redact:** `ClientId`, `UserName` (TBO needs to identify your account)

### 8.3 Log Retention

- Retain all booking and cancellation logs for **at least 6 months**
- TBO may request logs for audit purposes
- Store both request AND response for every API call

---

## 9. Current Implementation Gaps

Based on analysis of the current codebase (`tbo-flight-api.ts`, `tbo-flight-client.ts`, `tbo-flight-types.ts`), here are the gaps that would block certification:

### 9.1 Critical Gaps (Must Fix)

| # | Gap | Current State | Required for Certification |
|---|---|---|---|
| **G1** | **No dedicated flight API route** | `src/app/api/flights/route.ts` only reads from DB, not TBO | Need `/api/tbo-flights/search`, `/api/tbo-flights/book`, etc. |
| **G2** | **Endpoints hardcoded** | URLs hardcoded in `tbo-flight-api.ts` | Should be configurable via ConfigProvider (like hotel API) |
| **G3** | **No mock fallback** | "No Result Found" shows error to user | Should gracefully handle with empty results or mock |
| **G4** | **Raw error exposure** | TBO errors shown directly to users | Should map to user-friendly messages |
| **G5** | **No FareRule endpoint exposed to UI** | `getFareRule()` exists in client but no API route | Must expose for certification UI |
| **G6** | **No GetBookingDetail exposed** | `getBookingDetail()` exists but no API route | Must expose for confirmation page |

### 9.2 Important Gaps (Should Fix)

| # | Gap | Current State | Impact |
|---|---|---|---|
| **G7** | **Incomplete cancellation flow** | `cancelFlight()` exists but UI route missing | Certification requires full cancel flow |
| **G8** | **No partial cancellation** | Only full cancellation implemented | International multi-segment may need partial |
| **G9** | **Search cache TTL too aggressive** | 5-minute cache on search results | FareQuote handles re-validation, but cache may serve stale results |
| **G10** | **No IP whitelisting** | `EndUserIp` defaults to `192.168.1.1` | TBO may require real client IP for production |
| **G11** | **Token refresh edge case** | Token cached by date string, but midnight boundary not handled | Could fail at midnight IST |
| **G12** | **No logging of full request/response for certification** | Partial logging via `logApiCall` | Need full unredacted logs for submission |

### 9.3 Minor Gaps (Nice to Have)

| # | Gap | Impact |
|---|---|---|
| **G13** | No retry on Book/Ticket | Book has `maxRetries=2`, Ticket has `maxRetries=2` — acceptable |
| **G14** | No structured certification log exporter | Manual process to extract logs for submission |
| **G15** | No UI screenshots automation | Manual capture needed |

### 9.4 Recommended Pre-Certification Checklist

- [ ] Create dedicated API routes for each TBO flight endpoint
- [ ] Make endpoints configurable via ConfigProvider
- [ ] Add graceful error handling (user-friendly messages)
- [ ] Expose FareRule, GetBookingDetail, Cancellation via API routes
- [ ] Add real client IP detection (or configure via env var)
- [ ] Add full request/response logging for certification
- [ ] Test all 8+ domestic certification cases
- [ ] Test 6+ international certification cases
- [ ] Capture UI screenshots at each step
- [ ] Build certification log export tool
- [ ] Handle `IsPriceChanged` and `IsTimeChanged` in UI
- [ ] Display baggage, fare rules, cancellation policy in UI
- [ ] Test LCC and FSC flows separately
- [ ] Test with multi-passenger (adult + child + infant)

---

## 10. References

| Reference | URL |
|---|---|
| TBO API Portal | https://www.tbo.com/tbo-api |
| TBO API Documentation (legacy) | https://api.tektravels.com/FlightAPIDocument/ |
| TBO Hotel Certification (reference) | https://api.tbotechnology.in/AIS_Going-live-certification.aspx |
| TBO Air Overview | https://www.tboholidays.com/tboh-Air.aspx |
| Flight API Checklist (industry) | https://assets.ctfassets.net/sdx4pteldsvw/7f0xUMBlK4YrBxZx1pitTE/fd1281e49aadaa538cfab1524079e0bc/Flight-API-Checklist.pdf |
| Amadeus API Integration Guide | https://www.altexsoft.com/blog/amadeus-api-integration/ |
| Amadeus Quick Connect | https://traveltekpro.com/amadeus-quick-connect-aqc-api-integration-guide/ |
| TBO Air Integration Guide | https://traveltekpro.com/travel-boutique-online-flight-api-integration-complete-guide-to-tbo-api/ |

---

## 11. Implementation Roadmap

### Phase 1: Foundation (1-2 weeks)
1. Create API routes: `/api/tbo-flights/search`, `/api/tbo-flights/fare-rule`, `/api/tbo-flights/fare-quote`, `/api/tbo-flights/ssr`, `/api/tbo-flights/book`, `/api/tbo-flights/ticket`, `/api/tbo-flights/booking-detail`, `/api/tbo-flights/cancel`
2. Make endpoints configurable via ConfigProvider
3. Add proper error handling and user-friendly messages
4. Add real client IP detection

### Phase 2: UI Certification Pages (1-2 weeks)
1. Search results page with all required display fields
2. Fare rules popup
3. Booking form with all passenger fields
4. Confirmation page with PNR, ticket number, itinerary
5. Cancellation flow UI

### Phase 3: Test Case Execution (1 week)
1. Run all domestic test cases (DC-01 through DC-08)
2. Run all international test cases (IC-01 through IC-06)
3. Run special scenario tests (SS-01 through SS-08)
4. Capture all logs and screenshots

### Phase 4: Certification Submission (1-2 weeks)
1. Build certification log export tool
2. Create workflow diagram
3. Compile UI screenshots
4. Submit to TBO tech team
5. Address feedback and re-submit if needed

**Total estimated time: 4-7 weeks**
