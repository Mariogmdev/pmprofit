 /**
  * Sistema de logging condicional
  * Logs solo aparecen en desarrollo, no en producción
  */
 
 const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
 
 export const logger = {
   /**
    * Logs solo en desarrollo
    */
   dev: (...args: unknown[]) => {
     if (isDev) {
       console.log('[DEV]', ...args);
     }
   },
   
   /**
    * Warnings siempre (dev y prod)
    */
   warn: (...args: unknown[]) => {
     console.warn('[WARN]', ...args);
   },
   
   /**
    * Errores siempre (dev y prod)
    */
   error: (...args: unknown[]) => {
     console.error('[ERROR]', ...args);
   },
   
   /**
    * Info solo en desarrollo
    */
   info: (...args: unknown[]) => {
     if (isDev) {
       console.info('[INFO]', ...args);
     }
   },
 };
 
 export default logger;