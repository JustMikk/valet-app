-- The live selfie captured at a punch (a small JPEG data URL). Admin sees it in the roster and hours
-- review; how long it is kept is an open owner decision (product spec §13, OPEN_QUESTIONS P9).

alter table punches add column selfie_image text;
