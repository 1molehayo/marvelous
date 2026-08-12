-- Align photos bucket size with app media upload limit (12MB).
update storage.buckets
set file_size_limit = 12582912
where id = 'photos';
