import json
import os
import base64
from typing import Dict, Any, Optional
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import io
import psycopg2
from psycopg2.extras import RealDictCursor

def get_exif_data(image_data: bytes) -> Dict[str, Any]:
    '''
    Extract EXIF data from image bytes
    '''
    try:
        image = Image.open(io.BytesIO(image_data))
        exif_data = {}
        
        if hasattr(image, '_getexif') and image._getexif():
            exif = image._getexif()
            for tag_id, value in exif.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag == 'GPSInfo':
                    gps_data = {}
                    for t in value:
                        sub_tag = GPSTAGS.get(t, t)
                        gps_data[sub_tag] = value[t]
                    exif_data['GPSInfo'] = gps_data
                else:
                    exif_data[tag] = value
        
        return exif_data
    except Exception:
        return {}

def convert_to_degrees(value) -> float:
    '''
    Convert GPS coordinates to degrees
    '''
    d = float(value[0])
    m = float(value[1])
    s = float(value[2])
    return d + (m / 60.0) + (s / 3600.0)

def get_gps_coordinates(exif_data: Dict) -> Optional[tuple]:
    '''
    Extract GPS coordinates from EXIF data
    '''
    try:
        gps_info = exif_data.get('GPSInfo', {})
        if not gps_info:
            return None
        
        lat = gps_info.get('GPSLatitude')
        lat_ref = gps_info.get('GPSLatitudeRef')
        lng = gps_info.get('GPSLongitude')
        lng_ref = gps_info.get('GPSLongitudeRef')
        
        if lat and lng and lat_ref and lng_ref:
            lat_deg = convert_to_degrees(lat)
            lng_deg = convert_to_degrees(lng)
            
            if lat_ref == 'S':
                lat_deg = -lat_deg
            if lng_ref == 'W':
                lng_deg = -lng_deg
            
            return (lat_deg, lng_deg)
    except Exception:
        pass
    
    return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload photo and extract EXIF data
    Args: event - dict with httpMethod, body (base64 image and metadata)
          context - object with request_id
    Returns: HTTP response with photo data
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'GET':
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute('SELECT * FROM photos ORDER BY created_at DESC')
        photos = cur.fetchall()
        
        cur.close()
        conn.close()
        
        result = []
        for photo in photos:
            result.append({
                'id': photo['id'],
                'url': photo['url'],
                'title': photo['title'],
                'location': photo['location'],
                'lat': float(photo['lat']),
                'lng': float(photo['lng']),
                'exif': {
                    'camera': photo['camera'],
                    'lens': photo['lens'],
                    'iso': photo['iso'],
                    'aperture': photo['aperture'],
                    'shutter': photo['shutter'],
                    'date': photo['photo_date']
                }
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'photos': result})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        image_base64 = body_data.get('image', '')
        title = body_data.get('title', 'Без названия')
        location = body_data.get('location', 'Неизвестно')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Image is required'})
            }
        
        image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        
        exif_data = get_exif_data(image_data)
        coordinates = get_gps_coordinates(exif_data)
        
        lat = coordinates[0] if coordinates else 0.0
        lng = coordinates[1] if coordinates else 0.0
        
        camera = exif_data.get('Model', 'Неизвестная камера')
        lens = exif_data.get('LensModel', 'Неизвестный объектив')
        iso = str(exif_data.get('ISOSpeedRatings', 'N/A'))
        
        f_number = exif_data.get('FNumber')
        aperture = f'f/{f_number}' if f_number else 'N/A'
        
        exposure_time = exif_data.get('ExposureTime')
        shutter = f'1/{int(1/exposure_time)}s' if exposure_time and exposure_time > 0 else 'N/A'
        
        photo_date = exif_data.get('DateTime', 'Неизвестно')
        
        url = body_data.get('url', '')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute('''
            INSERT INTO photos (url, title, location, lat, lng, camera, lens, iso, aperture, shutter, photo_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        ''', (url, title, location, lat, lng, camera, lens, iso, aperture, shutter, photo_date))
        
        new_photo = cur.fetchone()
        conn.commit()
        
        cur.close()
        conn.close()
        
        result = {
            'id': new_photo['id'],
            'url': new_photo['url'],
            'title': new_photo['title'],
            'location': new_photo['location'],
            'lat': float(new_photo['lat']),
            'lng': float(new_photo['lng']),
            'exif': {
                'camera': new_photo['camera'],
                'lens': new_photo['lens'],
                'iso': new_photo['iso'],
                'aperture': new_photo['aperture'],
                'shutter': new_photo['shutter'],
                'date': new_photo['photo_date']
            }
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'photo': result})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
