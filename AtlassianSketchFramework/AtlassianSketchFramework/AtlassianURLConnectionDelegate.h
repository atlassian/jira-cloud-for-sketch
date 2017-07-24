//
//  AtlassianURLConnectionDelegate.h
//  AtlassianSketchFramework
//
//  Created by Tim Pettersen on 7/21/17.
//  Copyright © 2017 Atlassian. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface AtlassianURLConnectionDelegate : NSObject <NSURLConnectionDelegate>

@property (readonly, atomic, strong) NSProgress * progress;
@property (readonly, atomic, strong) NSError * error;
@property (readonly, atomic, strong) NSURLResponse * response;
@property (readonly, atomic, strong) NSMutableData * data;
@property (readonly, atomic) bool completed;
@property (readonly, atomic) bool failed;

@end
