declare module 'ical' {
  export interface VEvent {
    type: string;
    summary?: string;
    description?: string;
    start?: Date;
    end?: Date;
    uid?: string;
    location?: string;
    organizer?: string;
    attendee?: string | string[];
    rrule?: any;
    recurrences?: any;
    status?: string;
    transparency?: string;
    class?: string;
    created?: Date;
    lastmodified?: Date;
    dtstamp?: Date;
    sequence?: number;
    categories?: string[];
    url?: string;
    geo?: {
      lat: number;
      lon: number;
    };
    [key: string]: any;
  }

  export interface VCalendar {
    [key: string]: VEvent;
  }

  export function parseICS(data: string): VCalendar;
  export function parseFile(filename: string): VCalendar;
  
  const ical: {
    parseICS: typeof parseICS;
    parseFile: typeof parseFile;
  };
  
  export default ical;
}
