/* istanbul ignore next */
function getInternetExplorerVersion() {
  let rv = -1;
  if (navigator.appName == 'Microsoft Internet Explorer') {
    const ua = navigator.userAgent;
    const re = new RegExp('MSIE ([0-9]{1,}[\\.0-9]{0,})');
    if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
  } else if (navigator.appName === 'Netscape') {
    const ua = navigator.userAgent;
    const re = new RegExp('Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})');
    if (re.exec(ua) != null) rv = parseFloat(RegExp.$1);
  }
  return rv;
}
/* istanbul ignore next */
export default () => 'indexedDB' in self && !(getInternetExplorerVersion() > -1);
