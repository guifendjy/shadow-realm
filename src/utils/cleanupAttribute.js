export default function cleanupAttribute(el, attr) {
  try {
    el.removeAttribute(attr);
  } catch (e) {
    console.error(e);
  }
}
