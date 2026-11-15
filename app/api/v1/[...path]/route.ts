import {forwardExpress} from '@/lib/server/express-gateway';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=30;
export const GET=forwardExpress;
export const POST=forwardExpress;
export const PATCH=forwardExpress;
