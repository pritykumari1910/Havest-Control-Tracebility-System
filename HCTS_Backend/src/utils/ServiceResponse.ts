class ServiceResponse<T = unknown> {
  constructor(
    public success: boolean,
    public message: string,
    public responseObject: T | null = null,
    public statusCode = 200
  ) {}

  static success<T = unknown>(message: string, responseObject: T | null = null, statusCode = 200) {
    return new ServiceResponse<T>(true, message, responseObject, statusCode);
  }

  static failure<T = unknown>(message: string, responseObject: T | null = null, statusCode = 400) {
    return new ServiceResponse<T>(false, message, responseObject, statusCode);
  }
}

export default ServiceResponse;
