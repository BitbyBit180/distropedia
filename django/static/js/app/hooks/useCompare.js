import { useEffect, useState } from "dp/core/react.js";
import { getDistrosForCompare, peekDistrosForCompare } from "../services/distroApi.js";
const MAX_COMPARE = 4;
function useCompare(ids = []) {
  const key = ids.filter(Boolean).join(",");
  const [distros, setDistros] = useState(() => peekDistrosForCompare(ids) || []);
  const [loading, setLoading] = useState(() => Boolean(key) && !peekDistrosForCompare(ids));
  useEffect(() => {
    if (!key) {
      setDistros([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    if (!peekDistrosForCompare(key.split(","))) setLoading(true);
    getDistrosForCompare(key.split(",")).then((d) => {
      if (!cancelled) {
        setDistros(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return { distros, loading };
}
export {
  MAX_COMPARE,
  useCompare
};
