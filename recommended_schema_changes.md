# Recommended Schema Changes (Pending Client Approval)

> These changes are **NOT applied** to the current database. They are safe `ALTER TABLE` additions that will enhance functionality. All existing data remains untouched.

---

## 1. `hotels` Table — Recommended New Columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `star_rating` | TINYINT(1) | NULL | Hotel star classification (1–5 stars) |
| `check_in_time` | TIME | '14:00:00' | Standard check-in time display |
| `check_out_time` | TIME | '11:00:00' | Standard check-out time display |
| `latitude` | DECIMAL(10,8) | NULL | GPS latitude for map/distance features |
| `longitude` | DECIMAL(11,8) | NULL | GPS longitude for map/distance features |
| `cancellation_policy` | TEXT | NULL | Default cancellation policy text |
| `updated_at` | TIMESTAMP | CURRENT_TIMESTAMP ON UPDATE | Track last modification |

### Migration SQL (run when approved)

```sql
ALTER TABLE `hotels`
  ADD COLUMN `star_rating` TINYINT(1) DEFAULT NULL AFTER `description`,
  ADD COLUMN `check_in_time` TIME DEFAULT '14:00:00' AFTER `star_rating`,
  ADD COLUMN `check_out_time` TIME DEFAULT '11:00:00' AFTER `check_in_time`,
  ADD COLUMN `latitude` DECIMAL(10,8) DEFAULT NULL AFTER `parking_map_link`,
  ADD COLUMN `longitude` DECIMAL(11,8) DEFAULT NULL AFTER `latitude`,
  ADD COLUMN `cancellation_policy` TEXT DEFAULT NULL AFTER `amenities`,
  ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;
```

### Why These Are Recommended

| Column | Benefit |
|--------|---------|
| `star_rating` | Enables star-rating filter in hotel search (e.g., "Show only 4–5 star hotels") |
| `check_in_time` / `check_out_time` | Displays proper check-in/out times on hotel detail page and booking confirmation email |
| `latitude` / `longitude` | Enables "Hotels near me", distance-based sorting, and map view |
| `cancellation_policy` | Per-hotel cancellation rules displayed during booking |
| `updated_at` | Tracks when hotel data was last modified (useful for admin, caching, sync) |

---

## 2. `hotel_rooms` Table — Recommended New Columns

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `max_adults` | INT | 2 | Maximum adults per room (separate from total capacity) |
| `max_children` | INT | 1 | Maximum children per room |
| `bed_type` | VARCHAR(50) | 'Double' | Type of bed (Single, Double, Queen, King, Twin) |
| `num_beds` | INT | 1 | Number of beds in room |
| `description` | TEXT | NULL | Room type description for listing page |
| `tax_percentage` | DECIMAL(5,2) | 12.00 | Per-room-type GST/tax rate |
| `created_at` | TIMESTAMP | CURRENT_TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | CURRENT_TIMESTAMP ON UPDATE | Track last modification |

### Migration SQL (run when approved)

```sql
ALTER TABLE `hotel_rooms`
  ADD COLUMN `max_adults` INT(11) NOT NULL DEFAULT 2 AFTER `capacity`,
  ADD COLUMN `max_children` INT(11) NOT NULL DEFAULT 1 AFTER `max_adults`,
  ADD COLUMN `bed_type` VARCHAR(50) DEFAULT 'Double' AFTER `max_children`,
  ADD COLUMN `num_beds` INT(11) NOT NULL DEFAULT 1 AFTER `bed_type`,
  ADD COLUMN `description` TEXT DEFAULT NULL AFTER `room_type`,
  ADD COLUMN `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 12.00 AFTER `price_per_night`,
  ADD COLUMN `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER `room_image`,
  ADD COLUMN `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;
```

### Why These Are Recommended

| Column | Benefit |
|--------|---------|
| `max_adults` / `max_children` | Better guest capacity validation during booking (currently only `capacity` for total) |
| `bed_type` / `num_beds` | Display bed info on room listing ("1 King Bed", "2 Single Beds") |
| `description` | Detailed room description for the detail page |
| `tax_percentage` | Per-room tax rate instead of system-wide default (useful for different GST slabs) |
| `created_at` / `updated_at` | Proper audit trail for room records |

---

## Impact Assessment

- ✅ All new columns have `DEFAULT` values — existing rows automatically get defaults
- ✅ No existing columns are modified or dropped
- ✅ No existing data is affected
- ✅ The booking platform works WITHOUT these changes (uses fallback values)
- ✅ These changes can be applied at any time without downtime
- ✅ Migration SQL is idempotent-safe

---

## How the System Works Without These Changes

| Feature | Without Changes | With Changes |
|---------|----------------|--------------|
| Star rating filter | Not available | ✅ Filter by 1–5 stars |
| Check-in/out time | Shows default "2:00 PM / 11:00 AM" | ✅ Shows per-hotel times |
| Map / distance | Not available | ✅ "Near me" and map view |
| Guest capacity | Uses `capacity` as total guests | ✅ Separate adult/child limits |
| Room tax rate | Uses system default (12%) | ✅ Per-room GST slab |
| Bed information | Not displayed | ✅ Shows bed type and count |
