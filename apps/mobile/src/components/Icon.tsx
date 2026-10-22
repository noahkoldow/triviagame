import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

/**
 * Our own little icons (instead of the system emojis). Two-tone, rounded,
 * drawn on a 24×24 grid. Stroke icons take `color`; the others have fixed colours.
 */
export type IconName =
  | 'flame'
  | 'bolt'
  | 'heart'
  | 'bit'
  | 'gem'
  | 'book'
  | 'user'
  | 'lock'
  | 'warn'
  | 'close'
  | 'check'
  | 'down'
  | 'link'
  | 'shard'
  | 'cache';

export function Icon({
  name,
  size = 20,
  color = '#8FA3AD',
  muted = false,
}: {
  name: IconName;
  size?: number;
  color?: string;
  /** Greyed out, e.g. a heart that was lost. */
  muted?: boolean;
}) {
  const m = (c: string) => (muted ? '#37464F' : c);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'flame' ? (
        <>
          <Path
            d="M12 1.8c.6 3.8 5.8 6 5.8 12.2A5.8 5.8 0 0 1 12 22a5.8 5.8 0 0 1-5.8-5.8c0-2.4 1-4.3 2.4-5.5.1 1.6.9 2.7 2 3.2C10.3 8.7 10.4 5 12 1.8z"
            fill={m('#FF9600')}
          />
          <Path
            d="M12 21a3.4 3.4 0 0 1-3.4-3.4c0-1.7 1.1-2.8 1.9-4 .9.7 1.4 1.5 1.6 2.4.8-.5 1.1-1.3 1.2-2.1 1.3 1 2.1 2.3 2.1 3.7A3.4 3.4 0 0 1 12 21z"
            fill={m('#FFC800')}
          />
        </>
      ) : null}
      {name === 'bolt' ? (
        <>
          <Path d="M13.6 1.5 4.4 13.4h6.1l-1.7 9.1L19.6 9.4h-6.3z" fill={m('#FFC800')} />
          <Path d="M13.6 1.5 11 9.4h-2.2z" fill={m('#FFE680')} />
        </>
      ) : null}
      {name === 'heart' ? (
        <>
          <Path d="M12 21.2C5.4 16.6 3 13 3 9.6A4.6 4.6 0 0 1 12 7.8 4.6 4.6 0 0 1 21 9.6c0 3.4-2.4 7-9 11.6z" fill={m('#FF4B4B')} />
          <Circle cx={7.4} cy={9.2} r={1.4} fill="#FFFFFF" opacity={muted ? 0 : 0.55} />
        </>
      ) : null}
      {name === 'bit' ? (
        <>
          <Polygon points="12,2 20.5,7 20.5,17 12,22 3.5,17 3.5,7" fill={m('#1CB0F6')} />
          <Polygon points="12,6 16.8,8.8 16.8,15.2 12,18 7.2,15.2 7.2,8.8" fill={m('#7CD4FF')} />
          <Circle cx={12} cy={12} r={2.2} fill="#FFFFFF" />
        </>
      ) : null}
      {name === 'gem' ? (
        <>
          <Path d="M6.2 3h11.6L22 9.2 12 21.5 2 9.2z" fill={m('#CE82FF')} />
          <Path d="M6.2 3h11.6L15 9.2H9z" fill={m('#E8C2FF')} />
          <Path d="M2 9.2h7l3 12.3z" fill={m('#A15FD6')} />
          <Path d="M22 9.2h-7l-3 12.3z" fill={m('#B873EB')} />
        </>
      ) : null}
      {name === 'book' ? (
        <>
          <Path d="M5 3h13a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5z" fill="#1CB0F6" />
          <Rect x={3.5} y={3} width={4} height={18} rx={1.5} fill="#1487BF" />
          <Rect x={10} y={7} width={7} height={2.2} rx={1} fill="#FFFFFF" />
          <Rect x={10} y={11.5} width={7} height={2.2} rx={1} fill="#FFFFFF" opacity={0.7} />
        </>
      ) : null}
      {name === 'user' ? (
        <>
          <Circle cx={12} cy={8} r={4.2} fill="#DCE6EC" />
          <Path d="M3.5 21.5c0-4.6 3.8-7.3 8.5-7.3s8.5 2.7 8.5 7.3z" fill="#9FB1BD" />
        </>
      ) : null}
      {name === 'lock' ? (
        <>
          <Path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" stroke="#A9B8C6" strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Rect x={4.5} y={10} width={15} height={11.5} rx={3} fill="#FFC800" />
          <Circle cx={12} cy={15} r={1.8} fill="#A67C00" />
          <Rect x={11.2} y={15.5} width={1.6} height={3.4} rx={0.8} fill="#A67C00" />
        </>
      ) : null}
      {name === 'warn' ? (
        <>
          <Path d="M12 2.4c.6 0 1.1.3 1.4.8l8.4 14.7c.6 1.1-.2 2.5-1.4 2.5H3.6c-1.2 0-2-1.4-1.4-2.5l8.4-14.7c.3-.5.8-.8 1.4-.8z" fill={m('#FF9600')} />
          <Rect x={11} y={8.6} width={2} height={6.2} rx={1} fill="#FFFFFF" />
          <Circle cx={12} cy={17.6} r={1.2} fill="#FFFFFF" />
        </>
      ) : null}
      {name === 'close' ? (
        <Path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
      ) : null}
      {name === 'check' ? (
        <Path d="M4.5 12.8 9.7 18 19.5 6.5" stroke={color === '#8FA3AD' ? '#58CC02' : color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : null}
      {name === 'down' ? (
        <Path d="M12 4v14M6 12.5l6 6 6-6" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : null}
      {name === 'link' ? (
        <Path d="M3.5 12h17M7.5 7.5l-4 4.5 4 4.5M16.5 7.5l4 4.5-4 4.5" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : null}
      {name === 'shard' ? (
        <>
          <Polygon points="12,3 19.5,7.5 19.5,16.5 12,21 4.5,16.5 4.5,7.5" fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
          <Polygon points="12,8.5 15,10.3 15,13.7 12,15.5 9,13.7 9,10.3" fill={color} />
        </>
      ) : null}
      {name === 'cache' ? (
        <>
          <Path d="M8 3v3M12 3v3M16 3v3M8 18v3M12 18v3M16 18v3M3 8h3M3 12h3M3 16h3M18 8h3M18 12h3M18 16h3" stroke="#A9B8C6" strokeWidth={1.8} strokeLinecap="round" />
          <Rect x={6} y={6} width={12} height={12} rx={2.5} fill="#32465A" />
          <Rect x={9.5} y={9.5} width={5} height={5} rx={1} fill="#1CB0F6" />
        </>
      ) : null}
    </Svg>
  );
}
