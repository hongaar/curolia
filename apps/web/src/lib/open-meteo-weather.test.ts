import {
  dominantWeatherCode,
  formatOpenMeteoSubtitle,
  formatOpenMeteoSubtitleFromPayload,
  summarizeDailySeries,
  type DailyWeatherSeries,
} from "@curolia/plugin-open-meteo";
import { describe, expect, it } from "vitest";

describe("summarizeDailySeries", () => {
  const series: DailyWeatherSeries = {
    dates: ["2024-06-01", "2024-06-02", "2024-06-03"],
    tempMaxC: [20, 22, 18],
    tempMinC: [10, 12, 8],
    precipSumMm: [0, 2.5, 0],
    weatherCode: [0, 61, 0],
  };

  it("tracks period max temperature and dominant weather code", () => {
    const summary = summarizeDailySeries(series, "2024-06-01", "2024-06-03");
    expect(summary).not.toBeNull();
    expect(summary!.maxTempC).toBe(22);
    expect(summary!.dominantWeatherCode).toBe(0);
  });

  it("formats subtitle as condition and period maximum °C", () => {
    const summary = summarizeDailySeries(series, "2024-06-01", "2024-06-03");
    expect(formatOpenMeteoSubtitle(summary!)).toBe("☀️ Clear · 22°C");
  });

  it("formats a single day using daily maximum", () => {
    const single: DailyWeatherSeries = {
      dates: ["2024-06-01"],
      tempMaxC: [18],
      tempMinC: [12],
      precipSumMm: [0],
      weatherCode: [2],
    };
    const summary = summarizeDailySeries(single, "2024-06-01", "2024-06-01");
    expect(formatOpenMeteoSubtitle(summary!)).toBe("⛅ Cloudy · 18°C");
  });
});

describe("formatOpenMeteoSubtitleFromPayload", () => {
  it("matches summary formatting for historical payloads", () => {
    expect(
      formatOpenMeteoSubtitleFromPayload({
        weatherKind: "historical",
        weatherCode: 2,
        maxTempC: 17.4,
      }),
    ).toBe("⛅ Cloudy · 17°C");
  });

  it("formats current weather from tempC", () => {
    expect(
      formatOpenMeteoSubtitleFromPayload({
        weatherKind: "current",
        weatherCode: 0,
        tempC: 21.2,
      }),
    ).toBe("☀️ Clear · 21°C");
  });
});

describe("dominantWeatherCode", () => {
  it("picks the most frequent code", () => {
    expect(dominantWeatherCode([0, 61, 61, 61])).toBe(61);
  });
});
