export interface TBOFlightError {
  ErrorCode: number;
  ErrorMessage: string;
}

export interface TBOFlightAuthRequest {
  ClientId: string;
  UserName: string;
  Password: string;
  EndUserIp: string;
}

export interface TBOFlightAuthResponse {
  Status: number;
  TokenId: string;
  Error: TBOFlightError | null;
  Member: unknown | null;
}

export enum TBOJourneyType {
  OneWay = 1,
  Return = 2,
  MultiCity = 3,
  SpecialReturn = 5,
}

export enum TBOFlightCabinClass {
  All = 0,
  Economy = 1,
  PremiumEconomy = 2,
  Business = 3,
  PremiumBusiness = 4,
  First = 5,
}

export enum TBOPassengerType {
  Adult = 1,
  Child = 2,
  Infant = 3,
}

export enum TBOGender {
  Male = 1,
  Female = 2,
}

export interface TBOFlightSearchSegment {
  Origin: string;
  Destination: string;
  FlightCabinClass: TBOFlightCabinClass;
  PreferredDepartureTime: string;
  PreferredArrivalTime: string;
}

export interface TBOFlightSearchRequest {
  EndUserIp: string;
  TokenId: string;
  AdultCount: number;
  ChildCount: number;
  InfantCount: number;
  JourneyType: TBOJourneyType;
  Segments: TBOFlightSearchSegment[];
}

export interface TBOFlightFare {
  Currency: string;
  BaseFare: number;
  Tax: number;
  YQTax: number;
  AdditionalTxnFeeOfrd: number;
  AdditionalTxnFeePub: number;
  OtherCharges: number;
  Discount: number;
  PublishedFare: number;
  CommissionEarned: number;
  PLBEarned: number;
  IncentiveEarned: number;
  OfferedFare: number;
  TdsOnCommission: number;
  TdsOnPLB: number;
  TdsOnIncentive: number;
  ServiceFee: number;
  ChargeBU: { ChargeBUCode: string; ChargeBUAmount: number }[];
}

export interface TBOFlightFareBreakdown {
  Currency: string;
  PassengerType: TBOPassengerType;
  PassengerCount: number;
  BaseFare: number;
  Tax: number;
  YQTax: number;
  AdditionalTxnFeeOfrd: number;
  AdditionalTxnFeePub: number;
  OtherCharges: number;
  Discount: number;
  PublishedFare: number;
  CommissionEarned: number;
  PLBEarned: number;
  IncentiveEarned: number;
  OfferedFare: number;
  TdsOnCommission: number;
  TdsOnPLB: number;
  TdsOnIncentive: number;
  ServiceFee: number;
}

export interface TBOFlightSegmentAirline {
  AirlineCode: string;
  AirlineName: string;
  FlightNumber: string;
  FareClass: string;
  OperatingCarrier: string;
}

export interface TBOFlightSegmentAirport {
  AirportCode: string;
  AirportName: string;
  Terminal: string;
  CityCode: string;
  CityName: string;
  CountryCode: string;
  CountryName: string;
}

export interface TBOFlightSegmentOrigin {
  Airport: TBOFlightSegmentAirport;
  DepTime: string;
}

export interface TBOFlightSegmentDestination {
  Airport: TBOFlightSegmentAirport;
  ArrTime: string;
}

export interface TBOFlightSegment {
  TripIndicator: number;
  SegmentIndicator: number;
  Airline: TBOFlightSegmentAirline;
  Origin: TBOFlightSegmentOrigin;
  Destination: TBOFlightSegmentDestination;
  Duration: number;
  Baggage: string;
  CabinBaggage: string | null;
  CabinClass: number;
  NoOfSeatAvailable: number;
  GroundTime: number;
  Mile: number;
  StopOver: boolean;
  FlightInfoIndex: string;
  Craft: string;
  IsETicketEligible: boolean;
  FlightStatus: string;
  Status: string;
}

export interface TBOFlightFareClassification {
  Type: string;
  Color: string;
}

export interface TBOFlightPenaltyCharge {
  Type: string;
  Charge: number;
  Currency: string;
}

export interface TBOFlightResult {
  ResultIndex: string;
  Source: number;
  IsLCC: boolean;
  IsRefundable: boolean;
  Fare: TBOFlightFare;
  FareBreakdown: TBOFlightFareBreakdown[];
  Segments: TBOFlightSegment[][];
  LastTicketDate: string;
  Penalty: string;
  FareRules: string;
  AirlineRemark?: string;
  FareInclusions?: string[];
  FareClassification?: TBOFlightFareClassification;
  IsExclusiveFare?: boolean;
  IsFreeMealAvailable?: boolean;
  IsHoldAllowedWithSSR?: boolean;
  IsUpsellAllowed?: boolean;
  IsBookableIfSeatNotAvailable?: boolean;
  GSTAllowed?: boolean;
  IsGSTMandatory?: boolean;
  IsCouponAppilcable?: boolean;
  IsPanRequiredAtBook?: boolean;
  IsPassportRequiredAtBook?: boolean;
  ValidatingAirline?: string;
  PenaltyCharges?: TBOFlightPenaltyCharge[];
  MiniFareRules?: string;
  TicketAdvisory?: string;
  NonStopFirstRanking?: number;
  SmartChoiceRanking?: number;
}

export interface TBOFlightSearchResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
    TraceId: string;
    Results: TBOFlightResult[][];
  };
}

export interface TBOFlightFareRuleRequest {
  EndUserIp: string;
  TokenId: string;
  TraceId: string;
  ResultIndex: string;
}

export interface TBOFlightFareRuleDetail {
  Airline: string;
  Origin: string;
  Destination: string;
  FareBasisCode: string;
  FareRestriction: string;
  FareRuleDetail: string;
}

export interface TBOFlightFareRuleResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
    TraceId: string;
    FareRules: TBOFlightFareRuleDetail[];
  };
}

export interface TBOFlightFareQuoteRequest {
  EndUserIp: string;
  TokenId: string;
  TraceId: string;
  ResultIndex: string;
}

export interface TBOFlightFareQuoteResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
    TraceId: string;
    IsPriceChanged: boolean;
    Results: TBOFlightResult;
  };
}

export interface TBOFlightSSRRequest {
  EndUserIp: string;
  TokenId: string;
  TraceId: string;
  ResultIndex: string;
}

export interface TBOFlightBaggage {
  WayType: number;
  Code: string;
  Weight: string;
  Currency: string;
  Price: number;
  Origin: string;
  Destination: string;
  AirlineCode: string;
  FlightNumber: string;
}

export interface TBOFlightMeal {
  WayType: number;
  Code: string;
  Description: string | number;
  AirlineDescription: string | null;
  Quantity: number;
  Price: number;
  Currency: string;
  Origin?: string;
  Destination?: string;
  AirlineCode?: string;
  FlightNumber?: string;
}

export interface TBOFlightSeatRow {
  Code: string;
  RowNo: string;
  SeatNo: string;
  SeatType: string;
  Price: number;
}

export interface TBOFlightSegmentSeat {
  SegmentSeatId: number;
  RowSeats: { RowSeats: TBOFlightSeatRow[] };
}

export interface TBOFlightSSRData {
  Baggage: TBOFlightBaggage[][];
  MealDynamic: TBOFlightMeal[][];
  SeatDynamic: TBOFlightSegmentSeat[][];
}

export interface TBOFlightSSRResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
    TraceId: string;
    IsLCC: boolean;
    Baggage: TBOFlightBaggage[][];
    MealDynamic: TBOFlightMeal[][];
    SeatDynamic: TBOFlightSegmentSeat[][];
  };
}

export interface TBOFlightBookPassenger {
  Title: string;
  FirstName: string;
  LastName: string;
  PaxType: TBOPassengerType;
  DateOfBirth: string;
  Gender: TBOGender;
  AddressLine1: string;
  City: string;
  CountryCode: string;
  CountryName: string;
  ContactNo: string;
  Email: string;
  IsLeadPax: boolean;
  Nationality: string;
  Fare: {
    BaseFare: number;
    Tax: number;
    TransactionFee: number;
    YQTax: number;
    AdditionalTxnFeeOfrd: number;
    AdditionalTxnFeePub: number;
    AirTransFee: number;
  };
  GSTNumber?: string;
  GSTCompanyName?: string;
  GSTCompanyAddress?: string;
  GSTCompanyContactNumber?: string;
  GSTCompanyEmail?: string;
  PassportNo?: string;
  PassportExpiry?: string;
  PassportIssueCountryCode?: string;
}

export interface TBOFlightBookRequest {
  EndUserIp: string;
  TokenId: string;
  TraceId: string;
  ResultIndex: string;
  Passengers: TBOFlightBookPassenger[];
}

export interface TBOFlightBookResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
    TraceId: string;
    IsPriceChanged: boolean;
    IsTimeChanged: boolean;
    FlightItinerary: {
      BookingId: string;
      PNR: string;
      IsLCC: boolean;
      IsDomestic: boolean;
      Passenger: {
        PaxId: number;
        Title: string;
        FirstName: string;
        LastName: string;
        Ticket: unknown | null;
      }[];
    };
  };
}

export interface TBOFlightTicketNonLCCPassenger {
  PaxId: number;
  PassportNo: string;
  PassportExpiry: string;
  DateOfBirth: string;
}

export interface TBOFlightTicketNonLCCRequest {
  EndUserIp: string;
  TokenId: string;
  TraceId: string;
  PNR: string;
  BookingId: string;
  Passport: TBOFlightTicketNonLCCPassenger[];
}

export interface TBOFlightTicketLCCRequest {
  EndUserIp: string;
  TokenId: string;
  TraceId: string;
  ResultIndex: string;
  Passengers: (TBOFlightBookPassenger & {
    Baggage?: TBOFlightBaggage[];
    MealDynamic?: TBOFlightMeal[];
    SeatDynamic?: TBOFlightSeatRow[];
  })[];
}

export interface TBOFlightTicketResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
    TraceId: string;
    Response: {
      PNR: string;
      BookingId: string;
      IsPriceChanged: boolean;
      FlightItinerary: {
        BookingId: string;
        PNR: string;
        IsLCC: boolean;
        IsDomestic: boolean;
        Passenger: {
          PaxId: number;
          Title: string;
          FirstName: string;
          LastName: string;
          Ticket: {
            TicketId: number;
            TicketNumber: string;
            TicketStatus: string;
            TicketType: string;
            ConjunctionNumber: string;
            ValidOn: string;
          };
        }[];
        Segments: TBOFlightSegment[];
        Fare: TBOFlightFare;
        FareBreakdown: TBOFlightFareBreakdown[];
      };
    };
  };
}

export interface TBOFlightBookingDetailRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId?: string;
  PNR?: string;
  FirstName?: string;
  LastName?: string;
  TraceId?: string;
}

export interface TBOFlightBookingDetailResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
    TraceId: string;
    FlightItinerary: {
      BookingId: string;
      PNR: string;
      IsLCC: boolean;
      IsDomestic: boolean;
      Passenger: {
        PaxId: number;
        Title: string;
        FirstName: string;
        LastName: string;
        Ticket: {
          TicketId: number;
          TicketNumber: string;
          TicketStatus: string;
        }[];
      }[];
      Segments: TBOFlightSegment[];
      Fare: TBOFlightFare;
      FareBreakdown: TBOFlightFareBreakdown[];
    };
  };
}

export interface TBOFlightDisplay {
  resultIndex: string;
  leg: "outbound" | "inbound" | "oneway";
  isLCC: boolean;
  isRefundable: boolean;
  isDomestic?: boolean;
  originCountry?: string;
  destCountry?: string;
  source: number;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  operatingCarrier: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cabinClass: number;
  baggage: string;
  cabinBaggage: string | null;
  currency: string;
  publishedFare: number;
  baseRate?: number;
  markupAmount?: number;
  offeredFare: number;
  baseFare: number;
  tax: number;
  yqTax?: number;
  discount?: number;
  commissionEarned: number;
  penalty?: string;
  lastTicketDate?: string;
  fareRules?: string;
  segments: TBOFlightSegment[][];
  fareBreakdown: TBOFlightFareBreakdown[];
  airlineRemark?: string;
  fareInclusions?: string[];
  fareClassification?: TBOFlightFareClassification;
  isExclusiveFare?: boolean;
  isFreeMealAvailable?: boolean;
  isHoldAllowedWithSSR?: boolean;
  isUpsellAllowed?: boolean;
  gstAllowed?: boolean;
  isGSTMandatory?: boolean;
  isPassportRequiredAtBook?: boolean;
  isPanRequiredAtBook?: boolean;
  validatingAirline?: string;
  penaltyCharges?: TBOFlightPenaltyCharge[];
  ticketAdvisory?: string;
}

export interface TBOFlightSearchOutput {
  flights: TBOFlightDisplay[];
  traceId: string;
}

export interface TBOBookingResult {
  bookingId: string;
  pnr: string;
}

export interface TBOFlightTicketOutput {
  results: TBOBookingResult[];
}

// Flight Cancellation Types

export enum TBORequestType {
  NotSet = 0,
  FullCancellation = 1,
  PartialCancellation = 2,
  Reissuance = 3,
}

export enum TBOCancellationType {
  NotSet = 0,
  NoShow = 1,
  FlightCancelled = 2,
  Others = 3,
}

export interface TBOFlightGetCancellationChargesRequest {
  EndUserIp: string;
  TokenId: string;
  RequestType: TBORequestType;
  BookingId: number;
  BookingMode?: number;
}

export interface TBOFlightGetCancellationChargesResponse {
  Response: {
    TraceId: string;
    ResponseStatus: number;
    RefundAmount: number;
    CancellationCharge: number;
    Remarks: string;
    Currency: string;
    Error: TBOFlightError | null;
  };
}

export interface TBOFlightSendChangeRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId: number;
  RequestType: TBORequestType;
  CancellationType: TBOCancellationType;
  Remarks: string;
  Sectors?: { Origin: string; Destination: string }[];
  TicketId?: number[];
}

export interface TBOFlightSendChangeResponse {
  Response: {
    TicketCRInfo: {
      ChangeRequestId: number;
      Status: number;
      Remarks: string;
    };
    ResponseStatus: number;
    Error: TBOFlightError | null;
  };
}

export interface TBOFlightGetChangeRequestStatusRequest {
  EndUserIp: string;
  TokenId: string;
  ChangeRequestId: number;
}

export interface TBOFlightGetChangeRequestStatusResponse {
  Response: {
    ChangeRequestId: number;
    Status: number;
    Remarks: string;
    ResponseStatus: number;
    Error: TBOFlightError | null;
  };
}

export interface TBOFlightReleasePNRRequest {
  EndUserIp: string;
  TokenId: string;
  BookingId: number;
  Remarks: string;
}

export interface TBOFlightReleasePNRResponse {
  Response: {
    ResponseStatus: number;
    Error: TBOFlightError | null;
  };
}
