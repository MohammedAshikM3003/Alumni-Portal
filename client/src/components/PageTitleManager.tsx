import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';


function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;

    // Reset theme classes
    document.body.classList.remove('theme-admin', 'theme-alumni', 'theme-coordinator');

    if (pathname.startsWith('/admin')) {
      document.title = `Admin`;
      document.body.classList.add('theme-admin');
      return;
    }

    if (pathname.startsWith('/coordinator')) {
      document.title = `Coordinator`;
      document.body.classList.add('theme-coordinator');
      return;
    }

    if (pathname.startsWith('/alumini') || pathname.includes('/alumni') || pathname.includes('/mail/token')) {
      document.title = `Alumini`;
      document.body.classList.add('theme-alumni');
      return;
    }

  }, [location.pathname]);

  return null;
}

export default PageTitleManager;
