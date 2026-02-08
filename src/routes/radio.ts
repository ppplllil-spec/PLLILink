import { Hono } from 'hono'
const radio = new Hono()

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec";

radio.get('/', async (c) => {
    const res = await fetch(`${SHEET_URL}?type=radio`);
    const data = await res.json();
    return c.json(data);
});

export default radio
