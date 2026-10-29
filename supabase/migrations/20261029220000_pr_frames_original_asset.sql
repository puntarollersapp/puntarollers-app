-- Activate the approved PR Original asset only after public/frames/original.png exists.
-- The URL is same-origin and works across staging/production domains.
UPDATE public.pr_frame_catalog
SET image_url = '/frames/original.png'
WHERE id = 'original';
