<?php return array(
    'root' => array(
        'pretty_version' => '1.0.0+no-version-set',
        'version' => '1.0.0.0',
        'type' => 'library',
        'install_path' => __DIR__ . '/../../',
        'aliases' => array(),
        'reference' => null,
        'name' => '__root__',
        'dev' => true,
    ),
    'versions' => array(
        '__root__' => array(
            'pretty_version' => '1.0.0+no-version-set',
            'version' => '1.0.0.0',
            'type' => 'library',
            'install_path' => __DIR__ . '/../../',
            'aliases' => array(),
            'reference' => null,
            'dev_requirement' => false,
        ),
        'sendgrid/php-http-client' => array(
            'pretty_version' => '3.1.0',
            'version' => '3.1.0.0',
            'type' => 'library',
            'install_path' => __DIR__ . '/../sendgrid/php-http-client',
            'aliases' => array(),
            'reference' => '01c3fc4b94df008cfe03ffb467d4c6dbe6dcfb2c',
            'dev_requirement' => false,
        ),
        'sendgrid/sendgrid' => array(
            'pretty_version' => '5.0.4',
            'version' => '5.0.4.0',
            'type' => 'library',
            'install_path' => __DIR__ . '/../sendgrid/sendgrid',
            'aliases' => array(),
            'reference' => '1050d195525ff529036e7804f2c303261d65dca3',
            'dev_requirement' => false,
        ),
        'sendgrid/sendgrid-php' => array(
            'dev_requirement' => false,
            'replaced' => array(
                0 => '*',
            ),
        ),
    ),
);
