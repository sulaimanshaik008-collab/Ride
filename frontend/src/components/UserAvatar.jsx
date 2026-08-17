import React from 'react';
import maleAvatarImg from '../assets/male-avatar.png';
import femaleAvatarImg from '../assets/female-avatar.png';

export const UserAvatar = ({ user, size = 36, className = '' }) => {
  const name = (user?.fullName || user?.email || '').toLowerCase();
  
  // Female personas detection (Sarah, Eleanor, Sophia, Elena, etc.)
  const isFemale =
    user?.gender === 'female' ||
    name.includes('sarah') ||
    name.includes('eleanor') ||
    name.includes('sophia') ||
    name.includes('elena') ||
    name.includes('emily') ||
    name.includes('jane') ||
    name.includes('alice') ||
    name.includes('olivia') ||
    name.includes('emma') ||
    name.includes('priya') ||
    name.includes('maria') ||
    name.includes('clara');

  const avatarSrc = isFemale ? femaleAvatarImg : maleAvatarImg;

  return (
    <div
      className={`user-profile-avatar-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
        backgroundColor: isFemale ? '#f43f5e' : '#38bdf8',
      }}
      title={user?.fullName || (isFemale ? 'Female Profile' : 'Male Profile')}
    >
      <img
        src={avatarSrc}
        alt={user?.fullName || (isFemale ? 'Female Employee Profile' : 'Male Employee Profile')}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
};

export default UserAvatar;
