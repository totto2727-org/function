import { DurationFormat } from "npm:@formatjs/intl-durationformat@0.7.6";
import { Array, Data, DateTime, Duration, HashMap, Option } from "./effect.ts";

const shortFormatterHashMap = HashMap.empty<
  readonly string[],
  DurationFormat
>();

function shortFormatterFactory(
  option: { locale: string | string[] },
): DurationFormat {
  const searializable = Data.array(Array.ensure(option.locale));
  const cached = HashMap.get(shortFormatterHashMap, searializable);
  if (Option.isSome(cached)) {
    return cached.value;
  } else {
    const formatter = new DurationFormat(option.locale, {
      style: "narrow",
    });
    HashMap.set(searializable, formatter)(shortFormatterHashMap);
    return formatter;
  }
}

/**
 * Function that calculates the time difference between two dates and returns it as a string
 *
 * Note that only some properties of the time difference are displayed, not all.
 *
 * DurationFormat instances used internally are cached with locale values as keys.
 */
export function formatShort(
  from: DateTime.DateTime,
  to: DateTime.DateTime,
  option: { locale: string | string[] },
): string {
  const formatter: DurationFormat = shortFormatterFactory(option);

  const duration = DateTime.distanceDuration(from, to);

  const parts = Duration.parts(duration);

  if (parts.days >= 365 / 12) {
    return formatter.format({
      months: Math.trunc(parts.days / (365 / 12)) % 12,
      years: Math.trunc(parts.days / 365),
    });
  } else if (parts.days >= 7) {
    return formatter.format({
      weeks: Math.trunc(parts.days / 7),
    });
  } else if (parts.days !== 0) {
    return formatter.format({
      days: parts.days,
    });
  } else if (parts.hours !== 0) {
    return formatter.format({
      hours: parts.hours,
      minutes: parts.minutes,
    });
  }

  return formatter.format(Duration.parts(duration));
}
