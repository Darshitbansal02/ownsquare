import Notification from '../models/Notification.js';
// Foundation handoff to Dhruv: all event creators must use this service with their transaction session.
export async function postNotification(event,session) { return (await Notification.create([event],{session}))[0]; }
