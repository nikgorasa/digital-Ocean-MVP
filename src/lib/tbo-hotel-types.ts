export interface TBOError {
  ErrorCode: number;
  ErrorMessage: string;
}

export interface TBOStatus {
  Code: number;
  Description: string;
}

export interface TBOHotelAuthRequest {
  ClientId: string;
  UserName: string;
  Password: string;
  EndUserIp: string;
}

export interface TBOHotelAuthResponse {
  Status: number;
  TokenId: string;
  Error: TBOError | null;
  Member: unknown | null;
}

export interface TBOHotelPaxRoom {
  Adults: number;
  Children: number;
  ChildrenAges: number[];
}

export interface TBOHotelSearchRequest {
  CheckIn: string;
  CheckOut: string;
  HotelCodes: string;
  GuestNationality: string;
  PaxRooms: TBOHotelPaxRoom[];
  EndUserIp?: string;
  TokenId?: string;
  PreferredCurrency?: string;
  IsNearBySearch?: boolean;
  MaxRating?: number;
  MinRating?: number;
  ReviewCount?: number;
  SearchedCities?: string[];
}

export interface TBOHotelDayRate {
  BasePrice: number;
  ExtraGuest: number;
  Child: number;
}

export interface TBOHotelCancelPolicy {
  Index: string;
  FromDate: string;
  ChargeType: string;
  CancellationCharge: number;
}

export interface TBOHotelSupplement {
  Index: number;
  Type: string;
  Description: string;
  Price: number;
  Currency: string;
}

export interface TBOHotelRoom {
  Name: string[];
  BookingCode: string;
  Inclusion: string;
  DayRates?: TBOHotelDayRate[][];
  SelectedDateRange?: string;
  TotalFare: number;
  TotalTax: number;
  RoomID?: string[];
  RoomPromotion?: string[];
  CancelPolicies?: TBOHotelCancelPolicy[];
  MealType: string;
  IsRefundable: boolean;
  Supplements?: TBOHotelSupplement[][];
  WithTransfers: boolean;
}

export interface TBOHotelResult {
  HotelCode: string;
  Currency: string;
  Rooms: TBOHotelRoom[];
}

export interface TBOHotelSearchResponse {
  Status: TBOStatus;
  HotelResult: TBOHotelResult[];
  NoOfRooms: number;
}

export interface TBOHotelPreBookRequest {
  BookingCode: string;
  EndUserIp?: string;
  TokenId?: string;
  TraceId?: string;
}

export interface TBOHotelValidationInfo {
  PanMandatory: boolean;
  PanPassport: boolean;
  PassportMandatory: boolean;
}

export interface TBOHotelTaxBreakup {
  ChargeType: string;
  Amount: number;
  Description: string;
}

export interface TBOHotelPreBookRoom {
  Name: string[];
  Supplier: string;
  PassengerSlab: number;
  Currency: string;
  DayRates: TBOHotelDayRate[][];
  TotalFare: number;
  TotalTax: number;
}

export interface TBOHotelPreBookResponse {
  Status: TBOStatus;
  Amenities: string[];
  RateConditions: string[];
  ValidationInfo: TBOHotelValidationInfo;
  HotelName: string;
  HotelCode: string;
  RoomRate: number;
  RoomTax: number;
  RoomExtraGuestCharges: number;
  RoomChildCharges: number;
  ServiceFee: number;
  AgentCommission: number;
  TDS: number;
  NetAmount: number;
  NetTax: number;
  TaxBreakup: TBOHotelTaxBreakup[];
  RoomCombined: TBOHotelPreBookRoom[];
  TraceId: string;
}

export interface TBOHotelPassenger {
  Title: string;
  FirstName: string;
  LastName: string;
  PaxType: number;
  LeadPassenger: boolean;
  Age: number;
  Email: string;
  Phoneno: string;
  PassportNo?: string;
  PassportExpiry?: string;
  PAN?: string;
  AddressLine1?: string;
  City?: string;
  CountryCode?: string;
  CountryName?: string;
  Nationality?: string;
}

export interface TBOHotelRoomDetail {
  HotelPassenger: TBOHotelPassenger[];
}

export interface TBOHotelBookRequest {
  BookingCode: string;
  IsVoucherBooking: boolean;
  GuestNationality: string;
  EndUserIp?: string;
  TokenId?: string;
  TraceId?: string;
  NetAmount: number;
  HotelRoomsDetails: TBOHotelRoomDetail[];
}

export interface TBOHotelBookError {
  ErrorCode: number;
  ErrorMessage: string;
}

export interface TBOHotelBookResult {
  VoucherStatus: boolean;
  ResponseStatus: number;
  Error: TBOHotelBookError;
  TraceId: string;
  Status: number;
  HotelBookingStatus: string;
  InvoiceNumber: string;
  ConfirmationNo: string;
  BookingRefNo: string;
  BookingId: number;
  IsPriceChanged: boolean;
  IsCancellationPolicyChanged: boolean;
}

export interface TBOHotelBookResponse {
  BookResult: TBOHotelBookResult;
}

export interface TBOHotelBookingDetailRequest {
  EndUserIp?: string;
  TokenId?: string;
  BookingId?: number;
  TraceId?: string;
}

export interface TBOHotelBookingDetailPassenger {
  Title: string;
  FirstName: string;
  LastName: string;
  PaxType: number;
  LeadPassenger: boolean;
  Age: number;
  Email: string;
  Phoneno: string;
  PassportNo?: string;
  PAN?: string;
}

export interface TBOHotelBookingDetailRoom {
  RoomId: string;
  RoomName: string;
  BookingCode: string;
  HotelPassenger: TBOHotelBookingDetailPassenger[];
  DayRates: TBOHotelDayRate[][];
  TotalFare: number;
  TotalTax: number;
  MealType: string;
  IsRefundable: boolean;
  CancelPolicies: TBOHotelCancelPolicy[];
  Supplements: TBOHotelSupplement[][];
}

export interface TBOHotelBookingDetailPriceBreakup {
  RoomRate: number;
  RoomTax: number;
  ExtraGuestCharges: number;
  ChildCharges: number;
  ServiceFee: number;
  AgentCommission: number;
  TDS: number;
  NetAmount: number;
  NetTax: number;
  TaxBreakup: TBOHotelTaxBreakup[];
}

export interface TBOHotelBookingDetailData {
  BookingId: number;
  ConfirmationNo: string;
  BookingRefNo: string;
  InvoiceNumber: string;
  HotelBookingStatus: string;
  HotelName: string;
  HotelCode: string;
  Currency: string;
  CheckIn: string;
  CheckOut: string;
  GuestNationality: string;
  IsVoucherBooking: boolean;
  Rooms: TBOHotelBookingDetailRoom[];
  PriceBreakup: TBOHotelBookingDetailPriceBreakup;
  Amenities: string[];
}

export interface TBOHotelBookingDetailResponse {
  Status: TBOStatus;
  BookingDetail: TBOHotelBookingDetailData;
}

export interface TBOHotelCountry {
  Code: string;
  Name: string;
}

export interface TBOHotelCity {
  CityCode: number;
  CityName: string;
  CountryCode: string;
  CountryName: string;
}

export interface TBOHotelCodeItem {
  HotelCode: string;
  HotelName: string;
  Latitude?: string;
  Longitude?: string;
  HotelRating: string;
  Address?: string;
  CountryName?: string;
  CountryCode?: string;
  CityName?: string;
  CityCode?: number;
  HotelAddress?: string;
  HotelEmail?: string;
  HotelContact?: string;
}

export interface TBOHotelDetail {
  HotelCode: string;
  HotelName: string;
  HotelRating: string;
  HotelAddress?: string;
  Address?: string;
  HotelDescription?: string;
  Description?: string;
  HotelEmail?: string;
  Email?: string;
  HotelContact?: string;
  PhoneNumber?: string;
  HotelWebsite?: string;
  HotelFax?: string;
  HotelPinCode?: string;
  PinCode?: string;
  Amenities?: string[];
  HotelFacilities?: string[];
  Images?: string[];
  Image?: string;
  CountryCode?: string;
  CountryName?: string;
  CityCode?: number;
  CityId?: number;
  CityName?: string;
  Latitude?: number;
  Longitude?: number;
}

export interface TBOHotelRoomDisplay {
  roomId: string;
  name: string;
  roomName: string;
  bookingCode: string;
  mealType: string;
  isRefundable: boolean;
  totalFare: number;
  totalTax: number;
  inclusion: string;
  dayRates: { basePrice: number; date?: string }[];
  cancelPolicy: string;
  cancellationPolicy: string;
  roomIndex: number;
  typeCode: string;
  ratePlanCode: string;
  roomFare: number;
  roomTax: number;
  currency: string;
  amenities: string[];
}

export interface TBOHotelDisplay {
  hotelCode: number;
  name: string;
  hotelRating: number;
  location: string;
  currency: string;
  minTotalFare: number;
  rooms: TBOHotelRoomDisplay[];
  resultIndex: number;
  picture: string;
  rating: string;
  address: string;
  tripAdvisorRating: number;
  description: string;
  price: number;
  starRating: number;
  originalPrice: number;
  source?: "tbo" | "mock" | "fallback";
}

export interface TBOHotelSearchOutput {
  hotels: TBOHotelDisplay[];
  traceId: string;
}

export interface TBOHotelPreBookOutput {
  hotelName: string;
  hotelCode: string;
  netAmount: number;
  roomRate: number;
  roomTax: number;
  serviceFee: number;
  agentCommission: number;
  tds: number;
  validationInfo: TBOHotelValidationInfo;
  amenities: string[];
  rateConditions: string[];
  taxBreakup: { chargeType: string; amount: number }[];
  traceId: string;
}

export interface TBOHotelBookOutput {
  bookingId: number;
  confirmationNo: string;
  bookingRefNo: string;
  invoiceNumber: string;
  hotelBookingStatus: string;
  isPriceChanged: boolean;
}

export interface TBOHotelBookingDetailOutput {
  bookingId: number;
  confirmationNo: string;
  invoiceNumber: string;
  hotelName: string;
  hotelCode: string;
  checkIn: string;
  checkOut: string;
  status: string;
  rooms: {
    roomName: string;
    passengers: { title: string; firstName: string; lastName: string; paxType: number }[];
    totalFare: number;
    totalTax: number;
  }[];
  priceBreakup: {
    roomRate: number;
    roomTax: number;
    extraGuestCharges: number;
    childCharges: number;
    netAmount: number;
  };
}

export type TBODisplayHotel = TBOHotelDisplay;
export type TBODisplayRoom = TBOHotelRoomDisplay;
