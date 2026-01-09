/**
 * Firebase Configuration
 * Re-exports from lib/firebase for backward compatibility
 */

import app, { db, auth, storage } from '@/lib/firebase';

export { db, auth, storage };
export default app;
