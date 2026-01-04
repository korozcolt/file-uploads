declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  export function serve(req?: any, res?: any, next?: any): RequestHandler;
  export function setup(swaggerDoc: any, opts?: any): RequestHandler;
  const swaggerUi: { serve: RequestHandler; setup: (swaggerDoc: any, opts?: any) => RequestHandler };
  export default swaggerUi;
}
