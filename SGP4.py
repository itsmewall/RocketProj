from sgp4.api import Satrec
from sgp4.api import jday
import math

class Satellite:
    def __init__(self, tle_line1, tle_line2):
        self.satellite = Satrec.twoline2rv(tle_line1, tle_line2)

    def propagate(self, year, month, day, hour, minute, second):
        jd, fr = jday(year, month, day, hour, minute, second)
        e, r, v = self.satellite.sgp4(jd, fr)
        if e == 0:
            return r, v
        else:
            raise RuntimeError("Propagation error with error code: {}".format(e))

class Observer:
    def __init__(self, latitude, longitude, altitude):
        self.latitude = math.radians(latitude)
        self.longitude = math.radians(longitude)
        self.altitude = altitude

def calculate_look_angles(observer, satellite, year, month, day, hour, minute, second):
    r, _ = satellite.propagate(year, month, day, hour, minute, second)
    rx, ry, rz = r

    lat, lon, alt = observer.latitude, observer.longitude, observer.altitude

    # Observer's position in ECEF coordinates
    R = 6378.137  # Earth radius in km
    obs_x = (R + alt) * math.cos(lat) * math.cos(lon)
    obs_y = (R + alt) * math.cos(lat) * math.sin(lon)
    obs_z = (R + alt) * math.sin(lat)

    # Relative position vector in ECEF coordinates
    rel_x = rx - obs_x
    rel_y = ry - obs_y
    rel_z = rz - obs_z

    # Convert to topocentric-horizon coordinates
    topocentric_x = -math.sin(lon) * rel_x + math.cos(lon) * rel_y
    topocentric_y = -math.sin(lat) * math.cos(lon) * rel_x - math.sin(lat) * math.sin(lon) * rel_y + math.cos(lat) * rel_z
    topocentric_z = math.cos(lat) * math.cos(lon) * rel_x + math.cos(lat) * math.sin(lon) * rel_y + math.sin(lat) * rel_z

    range = math.sqrt(topocentric_x**2 + topocentric_y**2 + topocentric_z**2)
    elevation = math.asin(topocentric_z / range)
    azimuth = math.atan2(topocentric_y, topocentric_x)
    
    look_angles = {
        'range': range,
        'elevation': math.degrees(elevation),
        'azimuth': math.degrees(azimuth)
    }
    return look_angles

# Example usage
tle_line1 = "1 25544U 98067A   20332.54817472  .00016717  00000-0  10270-3 0  9005"
tle_line2 = "2 25544  51.6435  24.4788 0001357 109.8707  98.8282 15.49147375248726"
satellite = Satellite(tle_line1, tle_line2)

observer = Observer(28.5721, -80.6480, 0)  # Kennedy Space Center
look_angles = calculate_look_angles(observer, satellite, 2020, 11, 28, 12, 0, 0)
print(look_angles)
