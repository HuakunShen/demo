package bench

import "time"

type durationStats struct {
	count int64
	total time.Duration
	min   time.Duration
	max   time.Duration
}

func (s *durationStats) add(value time.Duration) {
	if value < 0 {
		value = 0
	}
	if s.count == 0 || value < s.min {
		s.min = value
	}
	if s.count == 0 || value > s.max {
		s.max = value
	}
	s.total += value
	s.count++
}

func (s durationStats) average() time.Duration {
	if s.count == 0 {
		return 0
	}
	return time.Duration(int64(s.total) / s.count)
}

func (s durationStats) summary() DurationSummary {
	return DurationSummary{
		Count: s.count,
		Avg:   s.average(),
		Min:   s.min,
		Max:   s.max,
	}
}

type DurationSummary struct {
	Count int64
	Avg   time.Duration
	Min   time.Duration
	Max   time.Duration
}
